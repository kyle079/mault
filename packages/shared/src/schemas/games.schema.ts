import { z } from "zod";
import { conditionOperatorSchema } from "./bin-settings.schema";

export const MIN_GAME_FIELDS = 1;

export const fieldTypeSchema = z.enum(["string", "numeric", "enum", "set"]);
export function createFieldMetaSchema(required?: string) {
  return z.object({
    field: z.string().min(1, required),
    label: z.string().min(1, required),
    type: fieldTypeSchema,
    path: z.string().min(1, required),
    operators: z.array(
      z.object({ value: conditionOperatorSchema, label: z.string() }),
    ),
    options: z
      .array(z.object({ value: z.string(), label: z.string() }))
      .optional(),
  });
}
export const fieldMetaSchema = createFieldMetaSchema();
export function createGameInputSchema(
  messages: {
    required?: string;
    keyFormat?: string;
    urlFormat?: string;
    minFields?: string;
  } = {},
) {
  const { required } = messages;
  return z.object({
    key: z
      .string()
      .trim()
      .min(1, required)
      .regex(/^[a-z0-9-]+$/, messages.keyFormat),
    name: z.string().trim().min(1, required),
    fieldDefinitions: z
      .array(createFieldMetaSchema(required))
      .min(MIN_GAME_FIELDS, messages.minFields),
    foilTypes: z.array(z.string()).optional(),
    apiDocsUrl: z
      .string()
      .trim()
      .url(messages.urlFormat)
      .or(z.literal(""))
      .nullable()
      .optional(),
    isActive: z.boolean().optional(),
  });
}
export const gameInputSchema = createGameInputSchema();
export const gameUpdateSchema = gameInputSchema.partial();
export type FieldType = z.infer<typeof fieldTypeSchema>;
export type FieldMeta = z.infer<typeof fieldMetaSchema>;
export type GameInput = z.infer<typeof gameInputSchema>;
