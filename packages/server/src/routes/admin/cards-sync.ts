import { cardSyncInputSchema } from "@magic-vault/shared";
import { Hono } from "hono";
import { requireAuth, requireRole, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";
import { syncOneCard } from "./shared";

export const cardsSyncRoute = new Hono<AppEnv>().post(
  "/cards/sync",
  requireAuth,
  requireRole("admin"),
  validateJson(cardSyncInputSchema),
  async (c) => {
    const { gameKey, cardId, lang } = c.req.valid("json");
    const result = await syncOneCard(gameKey, cardId, lang || "en");
    if (!result.success) {
      return c.json({ success: false, message: result.message }, result.status);
    }
    return c.json({ success: true, message: result.message });
  },
);
