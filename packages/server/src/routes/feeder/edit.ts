import type { FeederCalibration } from "@magic-vault/shared";
import { feederCalibrationSchema } from "@magic-vault/shared";
import { Hono } from "hono";
import { authQuery } from "../../db";
import { feederConfigAudit, feederConfigs } from "../../db/schema";
import { requireAuth, requireOrg, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";
import { rowToCalibration } from "./shared";

export const editFeederRoute = new Hono<AppEnv>().put(
  "/",
  requireAuth,
  requireOrg,
  validateJson(feederCalibrationSchema),
  async (c) => {
    const orgId = c.get("orgId");
    const calibration = c.req.valid("json");
    try {
      const result = await authQuery(c.get("jwtClaims"), async (tx) => {
        await tx
          .insert(feederConfigs)
          .values({ ...calibration, orgId })
          .onConflictDoUpdate({
            target: [feederConfigs.orgId],
            set: { ...calibration, updatedAt: new Date() },
          });

        await tx.insert(feederConfigAudit).values({ ...calibration, orgId });

        const row = await tx.query.feederConfigs.findFirst({
          where: (t, { eq }) => eq(t.orgId, orgId),
        });
        const saved: FeederCalibration = row
          ? rowToCalibration(row)
          : calibration;
        return { success: true, message: "Saved feeder config.", data: saved };
      });
      return c.json(result);
    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: "Database error." }, 500);
    }
  },
);
