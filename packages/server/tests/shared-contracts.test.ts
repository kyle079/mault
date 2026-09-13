import { namedResourceSchema, playingCardSchema } from "@magic-vault/shared";
import { Hono } from "hono";
import assert from "node:assert/strict";
import { test } from "node:test";
import { validateJson } from "../src/middleware/validate-json";

test("card validation preserves arbitrary provider metadata", () => {
  const card = {
    id: "card",
    name: "Card",
    image: null,
    set: "set",
    setName: "Set",
    collectorNumber: "1",
    rarity: "common",
    typeLine: "Creature",
    colorIdentity: [],
    price: null,
    priceFoil: null,
    raw: { providerSpecific: { colors: ["R"] } },
  };
  assert.deepEqual(playingCardSchema.parse(card), card);
});

test("HTTP validation rejects bad input before the handler and passes parsed values", async () => {
  let calls = 0;
  const app = new Hono().post("/", validateJson(namedResourceSchema), (c) => {
    calls++;
    return c.json(c.req.valid("json"));
  });
  const request = (body: string) =>
    app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
  for (const body of ["{", JSON.stringify({ name: "" })]) {
    assert.equal((await request(body)).status, 400);
  }
  assert.equal(calls, 0);
  const response = await request(
    JSON.stringify({ name: " Test ", orgId: "other" }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { name: "Test" });
  assert.equal(calls, 1);
});
