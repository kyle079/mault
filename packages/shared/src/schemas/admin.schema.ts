import { z } from "zod";

export const syncInputSchema = z.object({
  gameKey: z.string().min(1),
  lang: z.string().optional(),
});
export const cardSyncInputSchema = syncInputSchema.extend({
  cardId: z.string().trim().min(1),
});
export const cardDumpInputSchema = syncInputSchema
  .pick({ gameKey: true })
  .partial();
export type SyncInput = z.infer<typeof syncInputSchema>;
export type CardSyncInput = z.infer<typeof cardSyncInputSchema>;
export type CardDumpInput = z.infer<typeof cardDumpInputSchema>;
