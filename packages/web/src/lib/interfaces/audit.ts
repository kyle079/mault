import type { ReactNode } from "react";
export type {
  BinRouteAuditEntry,
  BinSetAuditEntry,
  FeederConfigAuditEntry,
  ModuleConfigAuditEntry,
} from "@magic-vault/shared";

export interface AuditEntry {
  guid: string;
  createdAt: string;
  label?: string;
  body: ReactNode;
}
