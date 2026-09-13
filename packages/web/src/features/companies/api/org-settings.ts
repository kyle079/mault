import { apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { ApiResult, DiscordLinkCode } from "@magic-vault/shared";
import {
  DEFAULT_ORG_SETTINGS,
  type OrgSettings,
  type OrgSettingsUpdate,
} from "@magic-vault/shared";
import { queryOptions } from "@tanstack/react-query";

export { DEFAULT_ORG_SETTINGS };
export type { OrgSettings };

export async function getOrgSettings(): Promise<ApiResult<OrgSettings>> {
  return apiGet("/api/org-settings");
}

export async function saveOrgSettings(
  patch: OrgSettingsUpdate,
): Promise<ApiResult<OrgSettings>> {
  return apiPut("/api/org-settings", patch);
}

export async function generateDiscordLinkCode(): Promise<
  ApiResult<DiscordLinkCode>
> {
  return apiPost("/api/org-settings/discord-link-code");
}

export async function unlinkDiscord(): Promise<ApiResult> {
  return apiPost("/api/org-settings/discord-unlink");
}

export const orgSettingsQueryOptions = (orgId: string | undefined) =>
  queryOptions({
    queryKey: ["org-settings", orgId],
    queryFn: () => getOrgSettings().then((r) => r.data ?? DEFAULT_ORG_SETTINGS),
    staleTime: Infinity,
    enabled: !!orgId,
  });
