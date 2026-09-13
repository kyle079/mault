import type {
  ScanIdsInput,
  ScannedCard,
  UnmatchedCard,
} from "../schemas/cards.schema";
import type { SyncState } from "./api.interface";
import type { Collection } from "./collections.interface";
import type { PhoneCameraMessage } from "./phone-camera.interface";
import type { ScanLockInfo, SessionViewer } from "./session.interface";

export interface SessionEvents {
  session_init: {
    collection: Collection;
    cards: ScannedCard[];
    unmatchedCards?: UnmatchedCard[];
    viewers?: SessionViewer[];
  };
  viewers_updated: { viewers: SessionViewer[] };
  card_added: ScannedCard;
  card_updated: ScannedCard;
  card_removed: Pick<ScannedCard, "scanId">;
  cards_removed: ScanIdsInput;
  cards_downloaded: ScanIdsInput;
  cards_cleared: Record<string, never>;
  unmatched_added: UnmatchedCard;
  unmatched_removed: Pick<UnmatchedCard, "scanId">;
  unmatched_cleared: Record<string, never>;
  scan_error: { message: string; timestamp: number };
  phone_camera_message: PhoneCameraMessage;
}
export interface OrgEvents {
  init: {
    counts: Record<string, number>;
    viewers: Record<string, SessionViewer[]>;
  };
  live_count: { guid: string; count: number };
  session_viewers: { guid: string } & SessionEvents["viewers_updated"];
  collections_changed: { guid?: string };
}
export interface LockEvents {
  init: { locks: Record<string, ScanLockInfo> };
  lock_acquired: { guid: string } & Pick<
    ScanLockInfo,
    "userId" | "displayName"
  >;
  lock_released: { guid: string };
}
export interface SyncEvents {
  progress: Partial<SyncState>;
  status: SyncState;
  done: Partial<SyncState>;
  log: { line: string };
  error: { message: string };
}
