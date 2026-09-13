import { z } from "zod";
import { SET_NAME_MAX_LENGTH } from "../constants/sort-bins.constant";

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(
    SET_NAME_MAX_LENGTH,
    `Name must be ${SET_NAME_MAX_LENGTH} characters or less`,
  );
export const namedResourceSchema = z.object({ name: nameSchema });
export const createCollectionSchema = namedResourceSchema.extend({
  gameGuid: z.string().min(1, "Game is required"),
  lang: z.string().min(1, "Language is required"),
});
export const createCollectionInputSchema = createCollectionSchema.partial({
  gameGuid: true,
  lang: true,
});
export const renameCollectionSchema = namedResourceSchema;
export const createSetSchema = namedResourceSchema;
export type CreateCollectionInput = z.infer<typeof createCollectionInputSchema>;
export type NamedResourceInput = z.infer<typeof namedResourceSchema>;
