import assert from "node:assert/strict";
import { test } from "node:test";
import {
  evaluateCardBin,
  type BinConfig,
  type BinRuleGroup,
  type FieldMeta,
} from "@magic-vault/shared";

const fields: FieldMeta[] = [
  { field: "color", label: "Color", type: "set", path: "colors", operators: [] },
  { field: "price", label: "Price", type: "numeric", path: "prices.usd", operators: [] },
];

function bin(
  binNumber: number,
  conditions: BinRuleGroup["conditions"],
  options: Partial<BinConfig> = {},
): BinConfig {
  return {
    guid: `bin-${binNumber}`,
    binNumber,
    rules: { id: `rules-${binNumber}`, combinator: "and", conditions },
    ...options,
  };
}

const colors = ["W", "U", "B", "R", "G"].map((color, index) =>
  bin(index + 1, [{ id: color, field: "color", operator: "contains_any", value: [color] }]),
);
const priceBin = bin(6, [{ id: "price", field: "price", operator: "gte", value: 1 }], {
  isOverride: true,
});
const catchAll = bin(7, [], { isCatchAll: true });
const configs = [...colors, priceBin, catchAll];

test("the $1 override takes priority only when its condition matches", () => {
  for (const price of ["1.00", "0.99", null]) {
    const card = { raw: { colors: ["U"], prices: { usd: price } } };
    assert.equal(evaluateCardBin(card, configs, fields), price === "1.00" ? priceBin : colors[1]);
  }
});

test("legacy and disabled overrides preserve first-match behavior", () => {
  const card = { colors: ["W", "U"], prices: { usd: 2 } };
  for (const isOverride of [undefined, false]) {
    assert.equal(evaluateCardBin(card, [...colors, { ...priceBin, isOverride }, catchAll], fields), colors[0]);
  }
});

test("multiple matching overrides use configuration order", () => {
  const earlierOverride = { ...colors[1], isOverride: true };
  const ordered = [colors[0], earlierOverride, priceBin, catchAll];
  assert.equal(evaluateCardBin({ colors: ["W", "U"], prices: { usd: 2 } }, ordered, fields), earlierOverride);
});

test("catch-all stays a fallback even if flagged as an override", () => {
  const fallback = { ...catchAll, isOverride: true };
  assert.equal(evaluateCardBin({ colors: ["W"] }, [fallback, ...colors], fields), colors[0]);
  assert.equal(evaluateCardBin({ colors: [] }, [fallback, ...colors], fields), fallback);
});

test("a full override remains the destination so capacity checks can stop scanning", () => {
  const full = { ...priceBin, cardLimit: 1 };
  const matched = evaluateCardBin({ colors: ["W"], prices: { usd: 2 } }, [...colors, full, catchAll], fields);
  assert.equal(matched, full);
});
