import { z } from "zod";
import { channelLayoutSchema } from "./calibration.schema";

export const scanRegionSchema = z.object({
  coverage: z.number(),
  offsetX: z.number(),
  offsetY: z.number(),
});
export const orgSettingsSchema = z.object({
  primaryColor: z.string().nullable(),
  scannerLayout: z.enum(["horizontal", "vertical"]),
  discordNotifyOnScan: z.boolean(),
  discordGuildId: z.string().nullable(),
  scanRegion: scanRegionSchema,
  captureSettleDelayMs: z.number(),
  moduleCount: z.number(),
  channelLayout: channelLayoutSchema,
});
export const orgSettingsUpdateSchema = orgSettingsSchema
  .omit({ discordGuildId: true })
  .partial()
  .extend({
    scannerLayout: orgSettingsSchema.shape.scannerLayout.nullable().optional(),
    scanRegion: scanRegionSchema.nullable().optional(),
    captureSettleDelayMs: orgSettingsSchema.shape.captureSettleDelayMs
      .nullable()
      .optional(),
  });
export const orgRoleSchema = z.enum(["owner", "admin", "member"]);
export const organizationNameSchema = z.object({ name: z.string().min(1) });
export const orgInviteSchema = z.object({
  email: z.string().email(),
  role: orgRoleSchema.exclude(["owner"]),
});
export const orgInviteInputSchema = orgInviteSchema.extend({
  role: orgRoleSchema.optional(),
});
export type OrgSettings = z.infer<typeof orgSettingsSchema>;
export type OrgSettingsUpdate = z.infer<typeof orgSettingsUpdateSchema>;
export type OrgRole = z.infer<typeof orgRoleSchema>;
export type OrgInviteInput = z.infer<typeof orgInviteSchema>;
export type ScanRegion = z.infer<typeof scanRegionSchema>;
