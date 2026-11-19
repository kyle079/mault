const serverEnvironmentKeys = [
  "AUTH_PROVIDER", "DATABASE_URL", "DATABASE_SSL", "NEON_AUTH_URL", "WEB_URL",
  "OWN_AUTH_TOKEN_PEPPER", "IMPERSONATION_SECRET", "RESEND_API_KEY",
  "RESEND_FROM_EMAIL", "VECTORIZE_CONCURRENCY", "SCAN_VECTORIZE_CONCURRENCY",
  "SYNC_INSERT_BATCH_SIZE", "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_ID_BUSINESS", "FREE_PLAN_DAILY_SCAN_LIMIT", "BOT_API_SECRET",
  "BOT_URL", "DISCORD_DONATION_CHANNEL_ID", "BUY_ME_A_COFFEE_WEBHOOK_SECRET",
  "ROLLBAR_SERVER_TOKEN",
] as const;

export type ServerEnvironment = Partial<Record<typeof serverEnvironmentKeys[number], string>>;

export function containerEnvironment(env: ServerEnvironment): Record<string, string> {
  const provider = env.AUTH_PROVIDER ?? "neon";
  if (provider !== "neon" && provider !== "local") {
    throw new Error("AUTH_PROVIDER must be neon or local.");
  }
  const required = ["DATABASE_URL", "WEB_URL", "IMPERSONATION_SECRET",
    provider === "neon" ? "NEON_AUTH_URL" : "OWN_AUTH_TOKEN_PEPPER"] as const;
  for (const key of required) {
    if (!env[key]?.trim()) throw new Error(`Missing Cloudflare binding: ${key}`);
  }

  const result: Record<string, string> = {
    NODE_ENV: "production", PORT: "3001", AUTH_PROVIDER: provider,
  };
  for (const key of serverEnvironmentKeys) {
    if (env[key] !== undefined) result[key] = env[key];
  }
  return result;
}
