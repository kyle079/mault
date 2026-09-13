import { scanIdsSchema } from "@magic-vault/shared";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { authQuery } from "../../db";
import { collectionCards } from "../../db/schema";
import { emitToOrg, emitToSession } from "../../lib/session-stream";
import { requireAuth, requireOrg, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";

export const removeBulkCollectionCardsRoute = new Hono<AppEnv>().post(
  "/:guid/cards/remove-bulk",
  requireAuth,
  requireOrg,
  validateJson(scanIdsSchema),
  async (c) => {
    const orgId = c.get("orgId");
    const guid = c.req.param("guid");
    const { scanIds } = c.req.valid("json");
    try {
      const result = await authQuery(c.get("jwtClaims"), async (tx) => {
        for (const scanId of scanIds) {
          await tx
            .delete(collectionCards)
            .where(
              and(
                eq(collectionCards.guid, scanId),
                eq(collectionCards.orgId, orgId),
              ),
            );
        }
        return { success: true, data: null };
      });
      if (result.success) {
        emitToSession(guid, "cards_removed", { scanIds });
        emitToOrg(orgId, "collections_changed", { guid });
      }
      return c.json(result);
    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: "Database error." }, 500);
    }
  },
);
