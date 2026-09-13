import {
  DEFAULT_CALIBRATION,
  DEFAULT_MODULE_COUNT,
  type ModuleConfig,
  type ServoCalibration,
} from "@magic-vault/shared";
import type { Transaction } from "../../db";

export async function getModuleCount(
  tx: Transaction,
  orgId: string,
): Promise<number> {
  const row = await tx.query.orgSettings.findFirst({
    where: (t, { eq }) => eq(t.orgId, orgId),
    columns: { moduleCount: true },
  });
  return row?.moduleCount ?? DEFAULT_MODULE_COUNT;
}

export type CalibRow = ServoCalibration & Pick<ModuleConfig, "moduleNumber">;

export function toModuleConfig(row: CalibRow): ModuleConfig {
  return {
    moduleNumber: row.moduleNumber,
    calibration: {
      bottomClosed: row.bottomClosed,
      bottomOpen: row.bottomOpen,
      paddleClosed: row.paddleClosed,
      paddleOpen: row.paddleOpen,
      pusherLeft: row.pusherLeft,
      pusherNeutral: row.pusherNeutral,
      pusherRight: row.pusherRight,
    },
  };
}

export function buildConfigs(
  rows: CalibRow[],
  moduleCount: number,
): ModuleConfig[] {
  return Array.from({ length: moduleCount }, (_, i) => i + 1).map((n) => {
    const row = rows.find((r) => r.moduleNumber === n);
    return row
      ? toModuleConfig(row)
      : { moduleNumber: n, calibration: { ...DEFAULT_CALIBRATION } };
  });
}
