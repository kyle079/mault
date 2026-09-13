import { resetPasswordSchema } from "@magic-vault/shared";
import { Hono } from "hono";
import { getOwnAuth } from "../../auth/own-auth-instance";
import type { AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";
import { authErrorResponse } from "./shared";

export const resetPasswordRoute = new Hono<AppEnv>().post(
  "/reset-password",
  validateJson(resetPasswordSchema),
  async (c) => {
    const { token, newPassword } = c.req.valid("json");
    if (!token || !newPassword) {
      return c.json(
        { success: false, message: "Token and new password are required." },
        400,
      );
    }
    try {
      await getOwnAuth().resetPassword({ token, newPassword });
      return c.json({ success: true, data: null });
    } catch (err) {
      const { message, status } = authErrorResponse(err);
      return c.json({ success: false, message }, status);
    }
  },
);
