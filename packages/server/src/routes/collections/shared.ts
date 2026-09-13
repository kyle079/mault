import type {
  Collection,
  DataResult,
  FieldMeta,
  ScannedCard,
  UnmatchedCard,
} from "@magic-vault/shared";
import { count, desc, eq, sql } from "drizzle-orm";
import type { Transaction } from "../../db";
import {
  collectionCards,
  collections,
  games,
  unmatchedCards,
} from "../../db/schema";

export function toCollection(row: {
  guid: string | null;
  name: string;
  isActive: boolean;
  cardCount: string | number;
  lang: string;
  createdAt: Date;
  updatedAt: Date;
  gameGuid: string | null;
  gameKey: string | null;
  gameName: string | null;
  gameIsActive: boolean | null;
  gameFieldDefinitions: unknown;
  gameFoilTypes: unknown;
  gameApiDocsUrl: string | null;
  gameCreatedAt: Date | null;
  gameUpdatedAt: Date | null;
}): Collection {
  return {
    guid: row.guid!,
    name: row.name,
    isActive: row.isActive,
    cardCount: Number(row.cardCount),
    lang: row.lang,
    game: row.gameGuid
      ? {
          guid: row.gameGuid,
          key: row.gameKey!,
          name: row.gameName!,
          isActive: row.gameIsActive!,
          fieldDefinitions: row.gameFieldDefinitions as FieldMeta[],
          foilTypes: (row.gameFoilTypes as string[] | null) ?? [],
          apiDocsUrl: row.gameApiDocsUrl,
          createdAt: row.gameCreatedAt!,
          updatedAt: row.gameUpdatedAt!,
        }
      : null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

type CollectionCardRow = typeof collectionCards.$inferSelect;
export function toScannedCard(
  row: Pick<CollectionCardRow, "guid" | "card" | "scannedAt" | "binNumber"> &
    Partial<
      Pick<
        CollectionCardRow,
        | "capturedImageDataUrl"
        | "isFoil"
        | "foilType"
        | "isDownloaded"
        | "alternativeMatches"
      >
    >,
): ScannedCard {
  return {
    scanId: row.guid!,
    card: row.card,
    scannedAt: row.scannedAt.getTime(),
    binNumber: row.binNumber ?? undefined,
    capturedImageUrl: row.capturedImageDataUrl ?? undefined,
    isFoil: row.isFoil ?? undefined,
    foilType: row.foilType ?? undefined,
    isDownloaded: row.isDownloaded ?? undefined,
    alternativeMatches: row.alternativeMatches ?? undefined,
  };
}

export function toUnmatchedCard(
  row: Pick<
    typeof unmatchedCards.$inferSelect,
    "guid" | "capturedImageDataUrl" | "scannedAt"
  >,
): UnmatchedCard {
  return {
    scanId: row.guid!,
    capturedImageUrl: row.capturedImageDataUrl ?? undefined,
    scannedAt: row.scannedAt.getTime(),
  };
}

export async function loadCollections(
  tx: Transaction,
  orgId: string,
): Promise<DataResult<Collection[]>> {
  const rows = await tx
    .select({
      id: collections.id,
      guid: collections.guid,
      name: collections.name,
      isActive: collections.isActive,
      cardCount: count(collectionCards.id),
      lang: collections.lang,
      createdAt: collections.createdAt,
      updatedAt: collections.updatedAt,
      gameGuid: games.guid,
      gameKey: games.key,
      gameName: games.name,
      gameIsActive: games.isActive,
      gameFieldDefinitions: games.fieldDefinitions,
      gameFoilTypes: games.foilTypes,
      gameApiDocsUrl: games.apiDocsUrl,
      gameCreatedAt: games.createdAt,
      gameUpdatedAt: games.updatedAt,
    })
    .from(collections)
    .leftJoin(collectionCards, eq(collectionCards.collectionId, collections.id))
    .leftJoin(games, eq(games.id, collections.gameId))
    .where(eq(collections.orgId, orgId))
    .groupBy(
      collections.id,
      collections.guid,
      collections.name,
      collections.isActive,
      collections.lang,
      collections.createdAt,
      collections.updatedAt,
      games.id,
    )
    .orderBy(desc(collections.updatedAt));

  return { success: true, data: rows.map(toCollection) };
}

export async function collectionNameTaken(
  tx: Transaction,
  orgId: string,
  name: string,
  excludeGuid?: string,
): Promise<boolean> {
  const trimmed = name.trim().toLowerCase();
  const existing = await tx.query.collections.findFirst({
    where: (t, { eq, and }) =>
      and(eq(t.orgId, orgId), sql`lower(trim(${t.name})) = ${trimmed}`),
    columns: { guid: true },
  });
  if (!existing) return false;
  return existing.guid !== excludeGuid;
}
