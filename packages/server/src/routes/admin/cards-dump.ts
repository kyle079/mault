import { cardDumpInputSchema } from "@magic-vault/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../db";
import { cardImageVectors } from "../../db/schema";
import { getStatus } from "../../lib/sync-job";
import { requireAuth, requireRole, type AppEnv } from "../../middleware/auth";

export const cardsDumpRoute = new Hono<AppEnv>().post(
  "/cards/dump",
  requireAuth,
  requireRole("admin"),
  async (c) => {
    if (getStatus().status === "running") {
      return c.json(
        { success: false, message: "Cannot dump while sync is running" },
        409,
      );
    }

    let gameKey: string | undefined;
    try {
      const text = await c.req.text();
      const body = cardDumpInputSchema.parse(
        text.trim() ? JSON.parse(text) : {},
      );
      if (body.gameKey) gameKey = body.gameKey;
    } catch {
      return c.json({ success: false, message: "Invalid request." }, 400);
    }

    if (gameKey) {
      await db
        .delete(cardImageVectors)
        .where(eq(cardImageVectors.gameKey, gameKey));
      return c.json({ success: true, message: `Cleared "${gameKey}" cards` });
    }

    await db.delete(cardImageVectors);
    return c.json({ success: true, message: "Card database cleared" });
  },
);
