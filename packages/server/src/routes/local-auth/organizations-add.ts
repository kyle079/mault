import { organizationNameSchema } from "@magic-vault/shared";
import { Hono } from "hono";
import { getOwnAuth } from "../../auth/own-auth-instance";
import { requireAuth, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";
import { authErrorResponse } from "./shared";

export const addOrganizationRoute = new Hono<AppEnv>().post(
  "/organizations",
  requireAuth,
  validateJson(organizationNameSchema),
  async (c) => {
    const { name } = c.req.valid("json");
    try {
      const { organisation } = await getOwnAuth().createOrganisation({
        name,
        ownerUserId: c.get("userId"),
      });
      return c.json({ success: true, data: organisation });
    } catch (err) {
      const { message, status } = authErrorResponse(err);
      return c.json({ success: false, message }, status);
    }
  },
);
