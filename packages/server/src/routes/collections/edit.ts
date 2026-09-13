import { renameCollectionSchema } from "@magic-vault/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { authQuery } from "../../db";
import { collections } from "../../db/schema";
import { emitToOrg } from "../../lib/session-stream";
import { requireAuth, requireOrg, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";
import { collectionNameTaken, loadCollections } from "./shared";

export const editCollectionRoute = new Hono<AppEnv>().put(
  "/:guid",
  requireAuth,
  requireOrg,
  validateJson(renameCollectionSchema),
  async (c) => {
    const orgId = c.get("orgId");
    const guid = c.req.param("guid");
    const { name } = c.req.valid("json");
    try {
      const result = await authQuery(c.get("jwtClaims"), async (tx) => {
        const target = await tx.query.collections.findFirst({
          where: (t, { eq, and }) => and(eq(t.guid, guid), eq(t.orgId, orgId)),
          columns: { id: true },
        });
        if (!target)
          return { success: false, message: "Collection not found." };
        if (await collectionNameTaken(tx, orgId, name, guid)) {
          return {
            success: false,
            message: `A collection named "${name.trim()}" already exists.`,
            nameTaken: true,
          };
        }
        await tx
          .update(collections)
          .set({ name, updatedAt: new Date() })
          .where(eq(collections.id, target.id));
        return loadCollections(tx, orgId);
      });
      if (result.success) emitToOrg(orgId, "collections_changed", { guid });
      return c.json(
        result,
        "nameTaken" in result && result.nameTaken ? 409 : 200,
      );
    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: "Database error." }, 500);
    }
  },
);
