import { apiGet, apiPost } from "@/lib/api/client";
import type {
  ApiResult,
  BillingStatus,
  RedirectUrl,
} from "@magic-vault/shared";
import { queryOptions } from "@tanstack/react-query";

export type { BillingStatus };

export async function getBillingStatus(): Promise<ApiResult<BillingStatus>> {
  return apiGet("/api/billing");
}

export async function createCheckoutSession(): Promise<ApiResult<RedirectUrl>> {
  return apiPost("/api/billing/checkout");
}

export async function createPortalSession(): Promise<ApiResult<RedirectUrl>> {
  return apiPost("/api/billing/portal");
}

export const billingQueryOptions = (orgId: string | undefined) =>
  queryOptions({
    queryKey: ["billing", orgId],
    queryFn: () => getBillingStatus().then((r) => r.data ?? null),
    enabled: !!orgId,
    // A 404 here just means billing isn't configured (self-hosted/no Stripe
    // keys) - not worth retrying.
    retry: false,
  });
