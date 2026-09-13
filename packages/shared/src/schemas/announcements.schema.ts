import { z } from "zod";

export const announcementSeveritySchema = z.enum(["info", "warning", "danger"]);
export const announcementDateSchema = z
  .string()
  .refine(
    (value) => value === "" || !Number.isNaN(Date.parse(value)),
    "Invalid date",
  );
export function createAnnouncementInputSchema(required?: string) {
  return z.object({
    severity: announcementSeveritySchema,
    message: z.string().trim().min(1, required),
    isActive: z.boolean().optional(),
    startsAt: announcementDateSchema.nullable().optional(),
    endsAt: announcementDateSchema.nullable().optional(),
  });
}
export const announcementInputSchema = createAnnouncementInputSchema();
export const announcementUpdateSchema = announcementInputSchema.partial();
export function hasValidAnnouncementDates(
  value: Pick<AnnouncementInput, "startsAt" | "endsAt">,
): boolean {
  return (
    !value.startsAt ||
    !value.endsAt ||
    new Date(value.endsAt) > new Date(value.startsAt)
  );
}
export type AnnouncementSeverity = z.infer<typeof announcementSeveritySchema>;
export type AnnouncementInput = z.infer<typeof announcementInputSchema>;
