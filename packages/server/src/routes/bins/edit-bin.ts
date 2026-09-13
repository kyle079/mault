import {
  applyBinUpdate,
  binUpdateSchema,
  type BinConfig,
} from "@magic-vault/shared";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { authQuery } from "../../db";
import { bins } from "../../db/schema";
import { requireAuth, requireOrg, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";
import { resolveGameId, snapshotBinSet } from "./shared";

export const editBinRoute = new Hono<AppEnv>().put(
  "/bins/:binNumber",
  requireAuth,
  requireOrg,
  validateJson(binUpdateSchema),
  async (c) => {
    const orgId = c.get("orgId");
    const binNumber = parseInt(c.req.param("binNumber"));
    const gameGuid = c.req.query("gameGuid");
    const update = c.req.valid("json");
    try {
      const result = await authQuery(c.get("jwtClaims"), async (tx) => {
        const gameId = await resolveGameId(tx, gameGuid);
        const activeBinSet = await tx.query.binSets.findFirst({
          where: (binSets, { eq, and, isNull }) =>
            gameId === null
              ? and(
                  eq(binSets.isActive, true),
                  isNull(binSets.gameId),
                  eq(binSets.orgId, orgId),
                )
              : and(
                  eq(binSets.isActive, true),
                  eq(binSets.gameId, gameId),
                  eq(binSets.orgId, orgId),
                ),
          columns: { id: true, guid: true },
          with: { bins: true },
        });
        if (!activeBinSet)
          return { message: "No active set found.", success: false };

        const existing = activeBinSet.bins.find(
          (b) => b.binNumber === binNumber,
        );
        const settings = applyBinUpdate(update, existing);

        if (settings.isCatchAll) {
          await tx
            .update(bins)
            .set({ isCatchAll: false, updatedAt: new Date() })
            .where(
              and(eq(bins.binSet, activeBinSet.id), eq(bins.isCatchAll, true)),
            );
        }

        if (existing) {
          await tx
            .update(bins)
            .set({
              ...settings,
              updatedAt: new Date(),
            })
            .where(eq(bins.id, existing.id));
        } else {
          await tx.insert(bins).values({
            binNumber,
            ...settings,
            binSet: activeBinSet.id,
            orgId,
          });
        }

        await snapshotBinSet(tx, activeBinSet.id, activeBinSet.guid!, orgId);

        const updatedBins = await tx.query.bins.findMany({
          where: (t, { eq }) => eq(t.binSet, activeBinSet.id),
          columns: {
            guid: true,
            binNumber: true,
            rules: true,
            isCatchAll: true,
            isOverride: true,
            cardLimit: true,
            lastEmptiedAt: true,
          },
        });

        return {
          message: "Successfully saved bin config.",
          success: true,
          data: updatedBins.map(
            (b): BinConfig => ({
              guid: b.guid!,
              binNumber: b.binNumber,
              rules: b.rules,
              isCatchAll: b.isCatchAll,
              isOverride: b.isOverride,
              cardLimit: b.cardLimit,
              lastEmptiedAt: b.lastEmptiedAt ? b.lastEmptiedAt.getTime() : null,
            }),
          ),
        };
      });
      return c.json(result);
    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: "Database error." }, 500);
    }
  },
);
