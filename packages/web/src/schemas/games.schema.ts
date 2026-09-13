import { createGameInputSchema, MIN_GAME_FIELDS } from "@magic-vault/shared";
import type { TFunction } from "i18next";
import { z } from "zod";

export function createGameFormSchema(t: TFunction<"games">) {
  const gameInputSchema = createGameInputSchema({
    required: t("gameFormDialog.validation.required"),
    keyFormat: t("gameFormDialog.validation.keyFormat"),
    urlFormat: t("gameFormDialog.validation.urlFormat"),
    minFields: t("gameFormDialog.validation.minFields"),
  });
  const fieldMetaFormSchema = gameInputSchema.shape.fieldDefinitions.element
    .omit({ operators: true, options: true })
    .extend({
      optionsText: z.string().optional(),
    });
  return gameInputSchema
    .omit({ foilTypes: true, fieldDefinitions: true, apiDocsUrl: true })
    .required({ isActive: true })
    .extend({
      apiDocsUrl: gameInputSchema.shape.apiDocsUrl.unwrap().unwrap().optional(),
      foilTypesText: z.string().optional(),
      fieldDefinitions: z
        .array(fieldMetaFormSchema)
        .min(MIN_GAME_FIELDS, t("gameFormDialog.validation.minFields")),
    });
}
export type GameFormValues = z.infer<ReturnType<typeof createGameFormSchema>>;
