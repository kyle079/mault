import type {
  BinRoute,
  FeederCalibration,
  ServoCalibration,
} from "../schemas/calibration.schema";
import type { BinConfig } from "./sort-bins.interface";

export interface BinSetAuditEntry {
  guid: string;
  binSetGuid: string;
  snapshot: BinConfig[];
  createdAt: string;
}

export interface BinRouteAuditEntry {
  guid: string;
  route: BinRoute;
  createdAt: string;
}

export interface FeederConfigAuditEntry {
  guid: string;
  calibration: FeederCalibration;
  createdAt: string;
}

export interface ModuleConfigAuditEntry {
  guid: string;
  moduleNumber: number;
  calibration: ServoCalibration;
  createdAt: string;
}
