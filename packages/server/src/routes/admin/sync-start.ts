import { syncInputSchema } from "@magic-vault/shared";
import { Hono } from "hono";
import { getStatus, startSync, SYNC_SOURCES } from "../../lib/sync-job";
import { requireAuth, requireRole, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";

export const syncStartRoute = new Hono<AppEnv>().post(
  "/sync",
  requireAuth,
  requireRole("admin"),
  validateJson(syncInputSchema),
  async (c) => {
    const body = c.req.valid("json");
    const { gameKey } = body;
    const lang = body.lang || "en";
    const source = SYNC_SOURCES[gameKey];
    if (!source) {
      return c.json(
        { success: false, message: `Unknown sync source: ${gameKey}` },
        400,
      );
    }
    if (!source.languages.includes(lang)) {
      return c.json(
        {
          success: false,
          message: `${source.label} does not support language: ${lang}`,
        },
        400,
      );
    }

    startSync(c.req.header("X-Org-Id"), gameKey, lang);
    return c.json({ success: true, data: getStatus() });
  },
);
