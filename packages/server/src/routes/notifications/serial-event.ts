import { serialEventReportSchema } from "@magic-vault/shared";
import { Hono } from "hono";
import { sendDiscordNotification } from "../../lib/discord";
import { classifySerialEvent } from "../../lib/serial-events";
import { requireAuth, requireOrg, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";

export const serialEventNotificationRoute = new Hono<AppEnv>().post(
  "/serial-event",
  requireAuth,
  requireOrg,
  validateJson(serialEventReportSchema),
  async (c) => {
    const event = c.req.valid("json");
    const classified = classifySerialEvent(event);
    if (classified) {
      const orgId = c.get("orgId");
      void sendDiscordNotification(
        orgId,
        {
          title: `Magic Vault — ${classified.title}`,
          description: classified.description,
          color: 0xed4245,
          timestamp: new Date().toISOString(),
        },
        "error",
        undefined,
        undefined,
        event.collectionGuid,
      );
    }
    return c.json({ success: true, message: "Serial event reported." });
  },
);
