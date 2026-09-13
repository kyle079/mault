import { z } from "zod";

export const playingCardImageSchema = z.object({
  small: z.string(),
  normal: z.string(),
});
export const playingCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  image: playingCardImageSchema.nullable(),
  set: z.string(),
  setName: z.string(),
  collectorNumber: z.string(),
  rarity: z.string(),
  typeLine: z.string(),
  text: z.string().optional(),
  manaCost: z.string().optional(),
  power: z.string().optional(),
  toughness: z.string().optional(),
  colorIdentity: z.array(z.string()),
  artist: z.string().optional(),
  price: z.number().nullable(),
  priceFoil: z.number().nullable(),
  sourceUrl: z.string().optional(),
  cmc: z.number().optional(),
  raw: z.unknown().optional(),
});
export const playingCardWithDistanceSchema = playingCardSchema.extend({
  distance: z.number(),
});
export const unmatchedCardSchema = z.object({
  scanId: z.string(),
  capturedImageUrl: z.string().optional(),
  scannedAt: z.number(),
});
export const scannedCardSchema = unmatchedCardSchema.extend({
  card: playingCardWithDistanceSchema,
  binNumber: z.number().optional(),
  alternativeMatches: z.array(playingCardWithDistanceSchema).optional(),
  isFoil: z.boolean().optional(),
  foilType: z.string().optional(),
  isDownloaded: z.boolean().optional(),
});
export const cardUpdateSchema = scannedCardSchema
  .pick({ card: true, binNumber: true, isFoil: true })
  .partial()
  .extend({
    foilType: scannedCardSchema.shape.foilType.unwrap().nullable().optional(),
  });
export const scanIdsSchema = z.object({ scanIds: z.array(z.string()) });
export type PlayingCardImage = z.infer<typeof playingCardImageSchema>;
export type PlayingCard = z.infer<typeof playingCardSchema>;
export type PlayingCardWithDistance = z.infer<
  typeof playingCardWithDistanceSchema
>;
export type ScannedCard = z.infer<typeof scannedCardSchema>;
export type UnmatchedCard = z.infer<typeof unmatchedCardSchema>;
export type CardUpdateInput = z.infer<typeof cardUpdateSchema>;
export type ScanIdsInput = z.infer<typeof scanIdsSchema>;
