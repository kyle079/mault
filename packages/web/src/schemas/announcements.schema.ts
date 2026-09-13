import {
  createAnnouncementInputSchema,
  hasValidAnnouncementDates,
} from "@magic-vault/shared";
import type { TFunction } from "i18next";
import { z } from "zod";

export function createAnnouncementFormSchema(t: TFunction<"announcements">) {
  const announcementInputSchema = createAnnouncementInputSchema(
    t("formDialog.validation.required"),
  );
  return announcementInputSchema
    .required({ isActive: true })
    .extend({
      startsAt: announcementInputSchema.shape.startsAt
        .unwrap()
        .unwrap()
        .optional(),
      endsAt: announcementInputSchema.shape.endsAt.unwrap().unwrap().optional(),
    })
    .refine(hasValidAnnouncementDates, {
      message: t("formDialog.validation.endAfterStart"),
      path: ["endsAt"],
    });
}
export type AnnouncementFormValues = z.infer<
  ReturnType<typeof createAnnouncementFormSchema>
>;
