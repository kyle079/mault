"""Authenticated WebSocket transport for the shared native controller."""
import asyncio
import contextlib
import hmac
import json
import logging
import os
import signal
import ssl
from pathlib import Path

from websockets.asyncio.server import serve
from websockets.exceptions import ConnectionClosed


def validate_command(raw):
    if not isinstance(raw, str) or len(raw.encode()) > 200:
        raise ValueError("command too long")
    command = json.loads(raw)
    if not isinstance(command, dict):
        raise ValueError("expected a command object")

    def integer(value, low, high):
        return type(value) is int and low <= value <= high

    if len(command) == 1:
        key, value = next(iter(command.items()))
        if key in {"getStatus", "test", "neutral", "clearDevice", "feeder", "feederStop", "readIR"}:
            if value is True:
                return command
        elif key == "setChannelOffset" and type(value) is int and value in (0, 4):
            return command
        elif key == "feederValue" and integer(value, 120, 490):
            return command
        elif key == "route" and isinstance(value, dict):
            if (set(value) == {"module", "direction"} and integer(value["module"], 1, 5)
                    and value["direction"] in ("left", "right", "bottom")):
                return command
        elif key in ("setConfig", "setFeederConfig") and isinstance(value, dict):
            ranges = {name: (120, 490) for name in (
                "bottomClosed", "bottomOpen", "paddleClosed", "paddleOpen",
                "pusherLeft", "pusherNeutral", "pusherRight")}
            if key == "setConfig":
                ranges["module"] = (1, 5)
                if "module" not in value:
                    raise ValueError("module is required")
            else:
                ranges = {"speed": (120, 490), "duration": (0, 10000),
                          "pulseDuration": (0, 10000), "pauseDuration": (0, 10000),
                          "settleDuration": (0, 10000)}
            if all(name in ranges and integer(item, *ranges[name]) for name, item in value.items()):
                return command
    if set(command) in ({"servo", "module", "value"}, {"servo", "module", "position"}):
        positions = {"bottom": ("open", "closed"), "paddle": ("open", "closed"),
                     "pusher": ("left", "neutral", "right")}
        servo = command["servo"]
        if isinstance(servo, str) and servo in positions and integer(command["module"], 1, 5):
            if ("value" in command and integer(command["value"], 120, 490)
                    or command.get("position") in positions[servo]):
                return command
    raise ValueError("invalid controller command")


class ControllerBridge:
    def __init__(self, token, executable, simulate=False):
        self.token = token
        self.executable = executable
        self.simulate = simulate
        self.busy = False

    async def handle(self, socket):
        try:
            auth = json.loads(await asyncio.wait_for(socket.recv(), 5))
            supplied = auth.get("token") if isinstance(auth, dict) else None
            if not isinstance(supplied, str) or not hmac.compare_digest(supplied.encode(), self.token.encode()):
                await socket.close(1008, "Invalid controller token")
                return
        except (ValueError, TimeoutError, ConnectionClosed):
            await socket.close(1008, "Authentication required")
            return
        if self.busy:
            await socket.close(1013, "Controller is already in use")
            return
        self.busy = True
        process = None
        tasks = []
        try:
            args = [self.executable] + (["--simulate"] if self.simulate else [])
            process = await asyncio.create_subprocess_exec(
                *args, stdin=asyncio.subprocess.PIPE, stdout=asyncio.subprocess.PIPE)
            boot = await asyncio.wait_for(process.stdout.readline(), 5)
            if not boot or json.loads(boot).get("board") != "pi_zero":
                raise RuntimeError("Pi controller failed to start")
            await socket.send(json.dumps({"authenticated": True}))
            await socket.send(boot.decode().strip())
            completed = asyncio.Event()

            async def read_responses():
                while line := await process.stdout.readline():
                    message = json.loads(line)
                    await socket.send(line.decode().strip())
                    if message.get("error") != "jam":
                        completed.set()
                raise RuntimeError("Pi controller exited")

            async def read_commands():
                async for raw in socket:
                    try:
                        command = validate_command(raw)
                    except (ValueError, TypeError):
                        await socket.send(json.dumps({"error": "invalid controller command"}))
                        continue
                    completed.clear()
                    process.stdin.write((json.dumps(command, separators=(",", ":")) + "\n").encode())
                    await process.stdin.drain()
                    await asyncio.wait_for(completed.wait(), 60)

            tasks = [asyncio.create_task(read_responses()), asyncio.create_task(read_commands()),
                     asyncio.create_task(socket.wait_closed())]
            done, _ = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                task.result()
        except (ConnectionClosed, BrokenPipeError, ConnectionResetError):
            pass
        except Exception:
            logging.exception("Controller connection failed")
            await socket.close(1011, "Controller failed; check the Pi service log")
        finally:
            for task in tasks:
                task.cancel()
            await asyncio.gather(*tasks, return_exceptions=True)
            if process is not None and process.returncode is None:
                with contextlib.suppress(ProcessLookupError):
                    process.terminate()
                try:
                    await asyncio.wait_for(process.wait(), 2)
                except TimeoutError:
                    with contextlib.suppress(ProcessLookupError):
                        process.kill()
                    await process.wait()
            self.busy = False


async def main():
    token = os.environ.get("MAULT_CONTROLLER_TOKEN", "")
    origins = [value.strip() for value in os.environ.get("MAULT_ALLOWED_ORIGINS", "").split(",") if value.strip()]
    if len(token) < 32 or not origins or "*" in origins:
        raise SystemExit("Set a token of at least 32 characters and explicit MAULT_ALLOWED_ORIGINS")
    executable = os.environ.get("MAULT_CONTROLLER_BINARY", str(Path(__file__).parent / "build/mault-controller"))
    bridge = ControllerBridge(token, executable, os.environ.get("MAULT_SIMULATE") == "1")
    tls = None
    cert, key = os.environ.get("MAULT_TLS_CERT"), os.environ.get("MAULT_TLS_KEY")
    if cert or key:
        if not cert or not key:
            raise SystemExit("Set both MAULT_TLS_CERT and MAULT_TLS_KEY")
        tls = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        tls.minimum_version = ssl.TLSVersion.TLSv1_2
        tls.load_cert_chain(cert, key)
    stop = asyncio.Event()
    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, stop.set)
    async with serve(bridge.handle, os.environ.get("MAULT_BIND", "127.0.0.1"),
                     int(os.environ.get("MAULT_PORT", "8765")), origins=origins,
                     ssl=tls, max_size=512, max_queue=1, compression=None,
                     ping_interval=5, ping_timeout=5, close_timeout=1):
        await stop.wait()


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())
