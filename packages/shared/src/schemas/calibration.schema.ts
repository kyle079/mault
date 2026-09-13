import { z } from "zod";

export const servoCalibrationSchema = z.object({
  bottomClosed: z.number(),
  bottomOpen: z.number(),
  paddleClosed: z.number(),
  paddleOpen: z.number(),
  pusherLeft: z.number(),
  pusherNeutral: z.number(),
  pusherRight: z.number(),
});
export const moduleConfigSchema = z.object({
  moduleNumber: z.number().int().positive(),
  calibration: servoCalibrationSchema,
});
export const feederCalibrationSchema = z.object({
  speed: z.number(),
  duration: z.number(),
  pulseDuration: z.number(),
  pauseDuration: z.number(),
  settleDuration: z.number(),
});
export const binDirectionSchema = z.enum(["left", "right", "bottom"]);
export const binRouteSchema = z.object({
  binNumber: z.number().int().positive(),
  module: z.number().int().positive(),
  direction: binDirectionSchema,
});
export const channelLayoutSchema = z.enum(["standard", "legacy"]);
export const calibrationExportSchema = z.object({
  formatVersion: z.literal(1),
  moduleCount: z.number().int().positive(),
  channelLayout: channelLayoutSchema,
  modules: z.array(moduleConfigSchema),
  feeder: feederCalibrationSchema,
  binRoutes: z.array(binRouteSchema),
});
export type ServoCalibration = z.infer<typeof servoCalibrationSchema>;
export type ModuleConfig = z.infer<typeof moduleConfigSchema>;
export type FeederCalibration = z.infer<typeof feederCalibrationSchema>;
export type BinRoute = z.infer<typeof binRouteSchema>;
export type BinDirection = z.infer<typeof binDirectionSchema>;
export type ChannelLayout = z.infer<typeof channelLayoutSchema>;
export type CalibrationExport = z.infer<typeof calibrationExportSchema>;
