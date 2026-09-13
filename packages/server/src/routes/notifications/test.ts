import {
  notificationTestSchema,
  type NotificationTestType,
} from "@magic-vault/shared";
import { Hono } from "hono";
import { sendDiscordNotification } from "../../lib/discord";
import { requireAuth, requireOrg, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";

const TEST_EMBEDS: Record<
  NotificationTestType,
  { title: string; description: string }
> = {
  "sorter-error": {
    title: "Magic Vault — Sorter Error [TEST]",
    description:
      "**Card:** Lightning Bolt\n**Bin:** 3\n**Error:** No response from the device in time.",
  },
  "feeder-empty": {
    title: "Magic Vault — Feeder Empty [TEST]",
    description:
      "No cards remaining in the hopper. Add more cards to continue.",
  },
  "card-jam": {
    title: "Magic Vault — Card Jam Detected [TEST]",
    description:
      "Card stuck at module 2 (heading to bin 5). Check the sorter and resume.",
  },
  "card-search-error": {
    title: "Magic Vault — Card Search Error [TEST]",
    description: "A database error occurred while searching for a card.",
  },
  "sync-failure": {
    title: "Magic Vault — Sync Failed [TEST]",
    description:
      "The card database sync job encountered a fatal error.\n\n**Error:** Scryfall catalog fetch failed: 503",
  },
};

export const testNotificationRoute = new Hono<AppEnv>().post(
  "/test",
  requireAuth,
  requireOrg,
  validateJson(notificationTestSchema),
  async (c) => {
    const { type } = c.req.valid("json");
    const embed = TEST_EMBEDS[type];
    const orgId = c.get("orgId");
    await sendDiscordNotification(
      orgId,
      {
        ...embed,
        color: 0xed4245,
        timestamp: new Date().toISOString(),
      },
      "error",
    );
    return c.json({ success: true, message: "Test notification sent." });
  },
);
