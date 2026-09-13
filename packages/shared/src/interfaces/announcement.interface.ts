import type { AnnouncementInput } from "../schemas/announcements.schema";
export type {
  AnnouncementInput,
  AnnouncementSeverity,
} from "../schemas/announcements.schema";

export interface Announcement extends Omit<
  Required<AnnouncementInput>,
  "startsAt" | "endsAt"
> {
  guid: string;
  startsAt: Date | null;
  endsAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
