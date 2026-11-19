"""Linux integration tests using the real sketch with simulated GPIO/PWM."""
import asyncio
import json
import os
import tempfile
import unittest
from pathlib import Path

from websockets.asyncio.client import connect
from websockets.asyncio.server import serve
from websockets.exceptions import ConnectionClosed, InvalidStatus
from bridge import ControllerBridge, validate_command


class ControllerTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.inputs = Path(self.directory.name) / "inputs"
        self.inputs.write_text("")
        self.previous = os.environ.get("MAULT_SIM_INPUTS")
        os.environ["MAULT_SIM_INPUTS"] = str(self.inputs)
        self.bridge = ControllerBridge("t" * 32, str(Path(__file__).parent / "build/mault-controller"), True)
        self.server = await serve(self.bridge.handle, "127.0.0.1", 0, origins=["https://mault.test"],
                                  ping_interval=0.1, ping_timeout=0.1)
        self.url = f"ws://127.0.0.1:{self.server.sockets[0].getsockname()[1]}"

    async def asyncTearDown(self):
        self.server.close()
        await self.server.wait_closed()
        self.directory.cleanup()
        if self.previous is None:
            os.environ.pop("MAULT_SIM_INPUTS", None)
        else:
            os.environ["MAULT_SIM_INPUTS"] = self.previous

    async def client(self):
        socket = await connect(self.url, origin="https://mault.test")
        await socket.send(json.dumps({"token": "t" * 32}))
        self.assertTrue(json.loads(await socket.recv())["authenticated"])
        self.assertEqual(json.loads(await socket.recv())["board"], "pi_zero")
        return socket

    async def command(self, socket, command):
        await socket.send(json.dumps(command))
        return json.loads(await asyncio.wait_for(socket.recv(), 8))

    async def test_calibration_sensors_routing_and_self_test(self):
        socket = await self.client()
        try:
            self.assertEqual((await self.command(socket, {"test": True}))["status"], "test_complete")
            await self.command(socket, {"setConfig": {"module": 1, "pusherLeft": 240}})
            await self.command(socket, {"setFeederConfig": {"duration": 20, "pulseDuration": 0}})
            self.assertTrue((await self.command(socket, {"feeder": True}))["empty"])
            self.inputs.write_text("16")
            response = await self.command(socket, {"feeder": True})
            self.assertFalse(response["detected"])
            self.assertFalse(response["empty"])
            self.inputs.write_text("17 27")
            sensors = await self.command(socket, {"readIR": True})
            self.assertEqual(sensors["ir"], [True, True, False, False, False])
            self.assertIn("blocked", (await self.command(socket, {"test": True}))["error"])
            result = await self.command(socket, {"route": {"module": 2, "direction": "left"}})
            self.assertEqual(result, {"status": "routed", "module": 2, "direction": "left"})
            self.inputs.write_text("17")
            result = await self.command(socket, {"route": {"module": 2, "direction": "bottom"}})
            self.assertIn("timeout", result["error"])
            await self.command(socket, {"setChannelOffset": 4})
            self.assertIn("1 to 3", (await self.command(socket, {"route": {"module": 4, "direction": "left"}}))["error"])
            self.assertIn("error", await self.command(socket, {"setChannelOffset": -1}))
        finally:
            await socket.close()

    async def test_authentication_exclusive_owner_and_disconnect_during_motion(self):
        with self.assertRaises(InvalidStatus):
            await connect(self.url, origin="https://other.test")
        async with connect(self.url, origin="https://mault.test") as denied:
            await denied.send('{"token":"wrong"}')
            with self.assertRaises(ConnectionClosed):
                await denied.recv()
        first = await self.client()
        async with connect(self.url, origin="https://mault.test") as second:
            await second.send(json.dumps({"token": "t" * 32}))
            with self.assertRaises(ConnectionClosed):
                await second.recv()
        self.inputs.write_text("16")
        await self.command(first, {"setFeederConfig": {"duration": 10000, "pulseDuration": 0}})
        await first.send('{"feeder":true}')
        await asyncio.sleep(0.1)
        await first.close()
        for _ in range(100):
            if not self.bridge.busy:
                break
            await asyncio.sleep(0.02)
        self.assertFalse(self.bridge.busy, "disconnect must interrupt a long feed")
        second = await self.client()
        self.assertEqual((await self.command(second, {"getStatus": True}))["status"], "ready")
        await second.close()

    def test_network_input_bounds(self):
        for command in ({"setChannelOffset": -1}, {"setChannelOffset": True},
                        {"setFeederConfig": {"duration": -1}}, {"feederValue": 100000},
                        {"servo": "bottom", "module": 0, "value": 300},
                        {"route": {"module": 1, "direction": "invalid"}},
                        {"neutral": True, "test": True}, {"setConfig": {"module": 1, "extra": 1}}):
            with self.assertRaises(ValueError):
                validate_command(json.dumps(command))


if __name__ == "__main__":
    unittest.main()
