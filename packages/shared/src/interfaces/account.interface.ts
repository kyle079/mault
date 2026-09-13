import type { OrgRole } from "../schemas/organizations.schema";

export interface ApiKey {
  id: string;
  keyPrefix: string;
  name: string;
  scopes: string[];
  status: "active" | "revoked";
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
}

export interface LocalAuthResult {
  token: string;
  user: Pick<LocalSessionUser, "id" | "name" | "email">;
}
export interface LocalSessionUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
}
export interface LocalOrg {
  id: string;
  name: string;
  role: string;
}
export interface Invitation {
  id: string;
  email: string;
  role: OrgRole;
  status: string;
  expiresAt: string;
}
export interface AuditEventRow {
  id: string;
  eventType: string;
  actor: string | null;
  target: string | null;
  createdAt: string;
}
