import { createApiKeyInputSchema } from "@magic-vault/shared";
import { Hono } from "hono";
import { getOwnAuth } from "../../auth/own-auth-instance";
import { requireAuth, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";
import { authErrorResponse } from "./shared";

export const addApiKeyRoute = new Hono<AppEnv>().post(
  "/api-keys",
  requireAuth,
  validateJson(createApiKeyInputSchema),
  async (c) => {
    const { name, expiresAt } = c.req.valid("json");
    try {
      const { apiKey, rawKey } = await getOwnAuth().createApiKey({
        name,
        actorUserId: c.get("userId"),
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });
      // rawKey is only ever returned here - own-auth stores just its hash.
      return c.json({ success: true, data: { apiKey, rawKey } });
    } catch (err) {
      const { message, status } = authErrorResponse(err);
      return c.json({ success: false, message }, status);
    }
  },
);
