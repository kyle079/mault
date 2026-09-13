import {
  announcementInputSchema,
  hasValidAnnouncementDates,
} from "@magic-vault/shared";
import { Hono } from "hono";
import { db } from "../../db";
import { announcements } from "../../db/schema";
import { requireAuth, requireRole, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";
import { toAnnouncement } from "./shared";

export const addAnnouncementRoute = new Hono<AppEnv>().post(
  "/",
  requireAuth,
  requireRole("admin"),
  validateJson(announcementInputSchema),
  async (c) => {
    const { severity, message, isActive, startsAt, endsAt } =
      c.req.valid("json");

    const startsAtDate = startsAt ? new Date(startsAt) : null;
    const endsAtDate = endsAt ? new Date(endsAt) : null;
    if (!hasValidAnnouncementDates({ startsAt, endsAt })) {
      return c.json(
        { success: false, message: "End time must be after start time." },
        400,
      );
    }

    try {
      const [row] = await db
        .insert(announcements)
        .values({
          severity,
          message: message.trim(),
          isActive: isActive ?? true,
          startsAt: startsAtDate,
          endsAt: endsAtDate,
        })
        .returning();
      return c.json({ success: true, data: toAnnouncement(row) });
    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: "Database error." }, 500);
    }
  },
);
