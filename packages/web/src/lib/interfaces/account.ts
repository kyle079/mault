export type { ApiKey } from "@magic-vault/shared";

export interface SessionRow {
  id: string;
  token: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
}
