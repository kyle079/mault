import type { PublicGame } from "./games.interface";
import type { Collection } from "./collections.interface";

export interface LinkResult {
  orgName?: string;
  currentOrgName?: string;
}

export type NotificationKind = "scan" | "error";

export interface StatsResult {
  collectionCount: number;
  cardCount: number;
  totalValue: number;
  collectionName?: string;
}

export type CollectionSummary = Pick<Collection, "name" | "cardCount"> & { guid: string | null };

export interface StatusOverride {
  name: string;
  scanChannelId: string | null;
  errorChannelId: string | null;
}

export interface StatusResult {
  orgScanChannelId: string | null;
  orgErrorChannelId: string | null;
  collection: StatusOverride | null;
  overrides: StatusOverride[];
}

export type GameSummary = Pick<PublicGame, "key" | "name">;

export interface BotLinkInput {
  guildId?: string;
  code?: string;
  confirm?: boolean;
}
export interface BotChannelInput {
  guildId?: string;
  channelId?: string;
  kind?: NotificationKind;
  collectionGuid?: string;
  clear?: boolean;
}
