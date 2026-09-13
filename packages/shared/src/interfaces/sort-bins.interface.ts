import type {
  BinCondition,
  BinRuleGroup,
  BinUpdate,
} from "../schemas/bin-settings.schema";
export type {
  BinCondition,
  BinRuleGroup,
  ConditionOperator,
} from "../schemas/bin-settings.schema";

import type { Game } from "./games.interface";

export type ConditionField = string;

export type { FieldMeta, FieldType } from "../schemas/games.schema";

export function isRuleGroup(
  item: BinCondition | BinRuleGroup,
): item is BinRuleGroup {
  return "combinator" in item && "conditions" in item;
}

export interface BinConfig extends BinUpdate {
  guid: string;
  binNumber: number;
  lastEmptiedAt?: number | null;
}

export interface BinSet {
  guid: string;
  name: string;
  isActive: boolean;
  bins: BinConfig[];
  game: Game | null;
  autoAssignField: string | null;
  scanOnly: boolean;
  createdAt: Date;
  updatedAt: Date;
}
