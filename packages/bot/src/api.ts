import type {
  ApiResult,
  BotChannelInput,
  BotLinkInput,
  CollectionSummary,
  GameSummary,
  LinkResult,
  NotificationKind,
  StatsResult,
  StatusResult,
} from "@magic-vault/shared";
export type {
  ApiResult,
  CollectionSummary,
  GameSummary,
  LinkResult,
  NotificationKind,
  StatsResult,
  StatusOverride,
  StatusResult,
} from "@magic-vault/shared";
const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001";
const BOT_API_SECRET = process.env.BOT_API_SECRET ?? "";

async function botFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  const res = await fetch(`${SERVER_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "X-Bot-Secret": BOT_API_SECRET,
      ...init?.headers,
    },
  });
  return res.json();
}

export function linkGuild(guildId: string, code: string, confirm = false) {
  return botFetch<LinkResult>("/bot/link", {
    method: "POST",
    body: JSON.stringify({ guildId, code, confirm } satisfies BotLinkInput),
  });
}

export function setChannel(
  guildId: string,
  channelId: string,
  kind: NotificationKind,
  collectionGuid?: string,
) {
  return botFetch<undefined>("/bot/set-channel", {
    method: "POST",
    body: JSON.stringify({
      guildId,
      channelId,
      kind,
      collectionGuid,
    } satisfies BotChannelInput),
  });
}

export function clearChannel(
  guildId: string,
  kind: NotificationKind,
  collectionGuid?: string,
) {
  return botFetch<undefined>("/bot/set-channel", {
    method: "POST",
    body: JSON.stringify({
      guildId,
      kind,
      collectionGuid,
      clear: true,
    } satisfies BotChannelInput),
  });
}

export function getStats(guildId: string, collectionGuid?: string) {
  const query = new URLSearchParams({ guildId });
  if (collectionGuid) query.set("collection", collectionGuid);
  return botFetch<StatsResult>(`/bot/stats?${query.toString()}`);
}

export function getCollections(guildId: string) {
  return botFetch<CollectionSummary[]>(
    `/bot/collections?guildId=${encodeURIComponent(guildId)}`,
  );
}

export function getStatus(guildId: string, collectionGuid?: string) {
  const query = new URLSearchParams({ guildId });
  if (collectionGuid) query.set("collection", collectionGuid);
  return botFetch<StatusResult>(`/bot/status?${query.toString()}`);
}

export function getGames() {
  return botFetch<GameSummary[]>("/public/games");
}
