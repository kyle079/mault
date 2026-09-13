import { tokenInputSchema } from "@magic-vault/shared";
import { Hono } from "hono";
import { getOwnAuth } from "../../auth/own-auth-instance";
import { requireAuth, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";
import { authErrorResponse } from "./shared";

// Deliberately requireAuth only, not requireOrg - the invitee doesn't have
// an X-Org-Id for the org they're about to join yet.
export const acceptInviteRoute = new Hono<AppEnv>().post(
  "/invites/accept",
  requireAuth,
  validateJson(tokenInputSchema),
  async (c) => {
    const { token } = c.req.valid("json");
    if (!token) {
      return c.json({ success: false, message: "Token is required." }, 400);
    }
    try {
      const result = await getOwnAuth().acceptInvite({
        token,
        userId: c.get("userId"),
      });
      return c.json({ success: true, data: result });
    } catch (err) {
      const { message, status } = authErrorResponse(err);
      return c.json({ success: false, message }, status);
    }
  },
);
