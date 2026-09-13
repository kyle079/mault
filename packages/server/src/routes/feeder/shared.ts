import type { FeederCalibration } from "@magic-vault/shared";

export function rowToCalibration(row: FeederCalibration): FeederCalibration {
  return {
    speed: row.speed,
    duration: row.duration,
    pulseDuration: row.pulseDuration,
    pauseDuration: row.pauseDuration,
    settleDuration: row.settleDuration,
  };
}
