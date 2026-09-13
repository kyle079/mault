import {
  applyBinUpdate,
  binUpdateSchema,
  DEFAULT_BIN_CAPACITY,
  type BinSettings,
} from "@magic-vault/shared";
import assert from "node:assert/strict";
import { test } from "node:test";

const settings: BinSettings = {
  rules: { id: "root", combinator: "and", conditions: [] },
  isCatchAll: false,
  isOverride: true,
  cardLimit: 25,
};

test("rules-only saves preserve settings; explicit null clears capacity", () => {
  const update = binUpdateSchema.parse({ rules: settings.rules });
  assert.deepEqual(applyBinUpdate(update, settings), settings);
  const unlimited = applyBinUpdate({ ...update, cardLimit: null }, settings);
  assert.equal(unlimited.cardLimit, null);
  assert.equal(applyBinUpdate(update, unlimited).cardLimit, null);
  assert.equal(applyBinUpdate(update).cardLimit, DEFAULT_BIN_CAPACITY);
});

test("catch-all disables override and explicit false clears an existing flag", () => {
  assert.equal(
    applyBinUpdate({ ...settings, isCatchAll: true }, settings).isOverride,
    false,
  );
  assert.equal(
    applyBinUpdate({ ...settings, isOverride: false }, settings).isOverride,
    false,
  );
});
