import { z } from "zod";
import { binSettingsSchema } from "./bin-settings.schema";
import { namedResourceSchema } from "./collections.schema";

export const defaultBinInitSchema = binSettingsSchema
  .partial({ isOverride: true })
  .extend({ binNumber: z.number().int().positive() });
export const copyBinSetSchema = namedResourceSchema.extend({
  gameGuid: z.string().optional(),
});
export const createBinSetSchema = copyBinSetSchema.extend({
  initialBins: z.array(defaultBinInitSchema).optional(),
});
export const scanOnlySchema = z.object({ enabled: z.boolean() });
export const autoAssignSchema = z.object({ field: z.string().nullable() });
export type DefaultBinInit = z.infer<typeof defaultBinInitSchema>;
export type CreateBinSetInput = z.infer<typeof createBinSetSchema>;
export type CopyBinSetInput = z.infer<typeof copyBinSetSchema>;
export type ScanOnlyInput = z.infer<typeof scanOnlySchema>;
export type AutoAssignInput = z.infer<typeof autoAssignSchema>;
