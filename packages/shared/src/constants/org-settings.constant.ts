import {
  DEFAULT_CHANNEL_LAYOUT,
  DEFAULT_MODULE_COUNT,
} from "../interfaces/module-configs.interface";
import {
  DEFAULT_CAPTURE_SETTLE_DELAY_MS,
  DEFAULT_SCAN_REGION,
} from "../interfaces/scanner.interface";
import type { OrgSettings } from "../schemas/organizations.schema";

export const DEFAULT_ORG_SETTINGS: OrgSettings = {
  primaryColor: null,
  scannerLayout: "horizontal",
  discordNotifyOnScan: false,
  discordGuildId: null,
  scanRegion: DEFAULT_SCAN_REGION,
  captureSettleDelayMs: DEFAULT_CAPTURE_SETTLE_DELAY_MS,
  moduleCount: DEFAULT_MODULE_COUNT,
  channelLayout: DEFAULT_CHANNEL_LAYOUT,
};
