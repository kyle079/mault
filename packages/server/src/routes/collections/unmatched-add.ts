import type { UnmatchedCard } from "@magic-vault/shared";
import { unmatchedCardSchema } from "@magic-vault/shared";
import { Hono } from "hono";
import { authQuery } from "../../db";
import { unmatchedCards } from "../../db/schema";
import { emitToSession } from "../../lib/session-stream";
import { requireAuth, requireOrg, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";

// POST /collections/:guid/unmatched — record a scan that found no card match
export const addUnmatchedCardRoute = new Hono<AppEnv>().post(
  "/:guid/unmatched",
  requireAuth,
  requireOrg,
  validateJson(unmatchedCardSchema),
  async (c) => {
    const orgId = c.get("orgId");
    const guid = c.req.param("guid");
    const { scanId, scannedAt, capturedImageUrl } = c.req.valid("json");
    try {
      const result = await authQuery(c.get("jwtClaims"), async (tx) => {
        const collection = await tx.query.collections.findFirst({
          where: (t, { eq, and }) => and(eq(t.guid, guid), eq(t.orgId, orgId)),
          columns: { id: true },
        });
        if (!collection)
          return { success: false, message: "Collection not found." };

        await tx
          .insert(unmatchedCards)
          .values({
            guid: scanId,
            collectionId: collection.id,
            capturedImageDataUrl: capturedImageUrl ?? null,
            scannedAt: new Date(scannedAt),
            orgId,
          })
          .onConflictDoNothing();

        return {
          success: true,
          data: { scanId, capturedImageUrl, scannedAt } as UnmatchedCard,
        };
      });
      if (result.success && result.data)
        emitToSession(guid, "unmatched_added", result.data);
      return c.json(result);
    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: "Database error." }, 500);
    }
  },
);
