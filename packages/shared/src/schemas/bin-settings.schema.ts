import { z } from "zod";
import {
  CONDITION_NUMERIC_MAX,
  CONDITION_STRING_MAX_LENGTH,
  DEFAULT_BIN_CAPACITY,
} from "../constants/sort-bins.constant";

export const conditionOperatorSchema = z.enum([
  "equals",
  "not_equals",
  "contains",
  "not_contains",
  "starts_with",
  "ends_with",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "not_in",
  "contains_any",
  "contains_all",
  "contains_none",
  "is_null",
  "is_not_null",
]);

export const binConditionSchema = z.object({
  id: z.string(),
  field: z.string().min(1),
  operator: conditionOperatorSchema,
  value: z.union([
    z.string().max(CONDITION_STRING_MAX_LENGTH),
    z.number().max(CONDITION_NUMERIC_MAX),
    z.array(z.string().max(CONDITION_STRING_MAX_LENGTH)),
  ]),
});

export const binRuleGroupSchema = z.object({
  id: z.string(),
  combinator: z.enum(["and", "or"]),
  get conditions(): z.ZodArray<
    z.ZodUnion<[typeof binConditionSchema, typeof binRuleGroupSchema]>
  > {
    return z.array(z.union([binConditionSchema, binRuleGroupSchema]));
  },
});

export const binSettingsSchema = z.object({
  rules: binRuleGroupSchema,
  isCatchAll: z.boolean(),
  isOverride: z.boolean(),
  cardLimit: z
    .number()
    .int()
    .min(1, "Limit must be at least 1 card")
    .max(CONDITION_NUMERIC_MAX)
    .nullable(),
});

// Existing clients and auto-detect send rules without the other settings.
export const binUpdateSchema = binSettingsSchema
  .partial()
  .required({ rules: true });

export type ConditionOperator = z.infer<typeof conditionOperatorSchema>;
export type BinCondition = z.infer<typeof binConditionSchema>;
export type BinRuleGroup = z.infer<typeof binRuleGroupSchema>;
export type BinSettings = z.infer<typeof binSettingsSchema>;
export type BinUpdate = z.infer<typeof binUpdateSchema>;

export function applyBinUpdate(
  update: BinUpdate,
  current?: BinUpdate,
): BinSettings {
  const isCatchAll = update.isCatchAll ?? current?.isCatchAll ?? false;
  return {
    rules: update.rules,
    isCatchAll,
    isOverride:
      !isCatchAll && (update.isOverride ?? current?.isOverride ?? false),
    cardLimit:
      update.cardLimit !== undefined
        ? update.cardLimit
        : current?.cardLimit !== undefined
          ? current.cardLimit
          : DEFAULT_BIN_CAPACITY,
  };
}
