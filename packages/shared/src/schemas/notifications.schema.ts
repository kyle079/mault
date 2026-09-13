import { z } from "zod";

export const serialCommandSchema = z.enum([
  "connect",
  "test",
  "feeder",
  "auto-feed",
  "bin",
  "jam",
]);
export const serialEventReportSchema = z.object({
  command: serialCommandSchema,
  sent: z.boolean(),
  response: z.unknown(),
  cardName: z.string().optional(),
  binNumber: z.number().optional(),
  collectionGuid: z.string().optional(),
});
export const notificationTestTypeSchema = z.enum([
  "sorter-error",
  "feeder-empty",
  "card-jam",
  "card-search-error",
  "sync-failure",
]);
export const notificationTestSchema = z.object({
  type: notificationTestTypeSchema,
});
export type SerialCommand = z.infer<typeof serialCommandSchema>;
export type SerialEventReport = z.infer<typeof serialEventReportSchema>;
export type NotificationTestType = z.infer<typeof notificationTestTypeSchema>;
