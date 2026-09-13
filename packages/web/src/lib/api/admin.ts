import { API_BASE, apiDelete, apiGet, apiPost } from "@/lib/api/client";
import { getAuthSession } from "@/lib/auth/session";
import type {
  AdminCard,
  AdminCardsPage,
  AdminUserSummary,
  CardGameCount,
  CardSyncInput,
  DataResult,
  ImpersonationAuditEntry,
  ImpersonationSession,
  Response,
  Result,
  SyncInput,
  SyncSourceInfo,
  SyncState,
} from "@magic-vault/shared";

export type { AdminCard, AdminCardsPage, CardGameCount, SyncSourceInfo };

export async function listSyncSources(): Promise<DataResult<SyncSourceInfo[]>> {
  return apiGet<DataResult<SyncSourceInfo[]>>("/api/admin/sync/sources");
}

export async function startSync(
  gameKey: string,
  lang: string = "en",
): Promise<DataResult<SyncState>> {
  return apiPost<DataResult<SyncState>>("/api/admin/sync", {
    gameKey,
    lang,
  } satisfies SyncInput);
}

export async function cancelSync(): Promise<DataResult<SyncState>> {
  return apiDelete<DataResult<SyncState>>("/api/admin/sync");
}

export async function getSyncStatus(): Promise<DataResult<SyncState>> {
  return apiGet<DataResult<SyncState>>("/api/admin/sync");
}

export async function listCardGameKeys(): Promise<DataResult<CardGameCount[]>> {
  return apiGet<DataResult<CardGameCount[]>>("/api/admin/cards/games");
}

export async function dumpCards(gameKey?: string): Promise<Response> {
  return apiPost<Response>(
    "/api/admin/cards/dump",
    gameKey ? { gameKey } : undefined,
  );
}

export async function listCards(
  page: number,
  search: string,
): Promise<DataResult<AdminCardsPage>> {
  const params = new URLSearchParams({ page: String(page), limit: "50" });
  if (search) params.set("search", search);
  return apiGet<DataResult<AdminCardsPage>>(`/api/admin/cards?${params}`);
}

export async function revectorizeCard(cardId: string): Promise<Response> {
  return apiPost<Response>(
    `/api/admin/cards/${encodeURIComponent(cardId)}/revectorize`,
  );
}

export async function syncCardById(
  gameKey: string,
  cardId: string,
  lang: string = "en",
): Promise<Response> {
  return apiPost<Response>("/api/admin/cards/sync", {
    gameKey,
    cardId,
    lang,
  } satisfies CardSyncInput);
}

export async function createSyncEventSource(): Promise<EventSource> {
  const session = await getAuthSession();
  const url = `${API_BASE}/api/admin/sync/stream${session?.token ? `?token=${encodeURIComponent(session.token)}` : ""}`;
  return new EventSource(url);
}

export async function searchAdminUsers(
  search: string,
): Promise<Result<AdminUserSummary[]>> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  return apiGet<Result<AdminUserSummary[]>>(`/api/admin/users?${params}`);
}

export async function startImpersonation(
  userId: string,
): Promise<Result<ImpersonationSession>> {
  return apiPost<Result<ImpersonationSession>>(
    `/api/admin/impersonate/${encodeURIComponent(userId)}`,
  );
}

export async function listImpersonationAudit(): Promise<
  Result<ImpersonationAuditEntry[]>
> {
  return apiGet<Result<ImpersonationAuditEntry[]>>(
    "/api/admin/impersonation-audit",
  );
}

export async function stopImpersonation(): Promise<Result<null>> {
  return apiPost<Result<null>>("/api/admin/impersonate/stop");
}

export async function testServerRollbar(): Promise<Response> {
  return apiPost<Response>("/api/admin/rollbar/test");
}
