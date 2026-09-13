import {
  announcementUpdateSchema,
  hasValidAnnouncementDates,
} from "@magic-vault/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../../db";
import { announcements } from "../../db/schema";
import { requireAuth, requireRole, type AppEnv } from "../../middleware/auth";
import { validateJson } from "../../middleware/validate-json";
import { toAnnouncement } from "./shared";

export const editAnnouncementRoute = new Hono<AppEnv>().put(
  "/:guid",
  requireAuth,
  requireRole("admin"),
  validateJson(announcementUpdateSchema),
  async (c) => {
    const guid = c.req.param("guid");
    const { severity, message, isActive, startsAt, endsAt } =
      c.req.valid("json");

    const startsAtDate =
      startsAt !== undefined
        ? startsAt
          ? new Date(startsAt)
          : null
        : undefined;
    const endsAtDate =
      endsAt !== undefined ? (endsAt ? new Date(endsAt) : null) : undefined;
    if (!hasValidAnnouncementDates({ startsAt, endsAt })) {
      return c.json(
        { success: false, message: "End time must be after start time." },
        400,
      );
    }

    try {
      const target = await db.query.announcements.findFirst({
        where: (t, { eq }) => eq(t.guid, guid),
        columns: { id: true },
      });
      if (!target)
        return c.json(
          { success: false, message: "Announcement not found." },
          404,
        );

      const updates: Partial<typeof announcements.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (severity !== undefined) updates.severity = severity;
      if (message !== undefined) updates.message = message.trim();
      if (isActive !== undefined) updates.isActive = isActive;
      if (startsAtDate !== undefined) updates.startsAt = startsAtDate;
      if (endsAtDate !== undefined) updates.endsAt = endsAtDate;

      const [row] = await db
        .update(announcements)
        .set(updates)
        .where(eq(announcements.id, target.id))
        .returning();
      return c.json({ success: true, data: toAnnouncement(row) });
    } catch (err) {
      console.error(err);
      return c.json({ success: false, message: "Database error." }, 500);
    }
  },
);
