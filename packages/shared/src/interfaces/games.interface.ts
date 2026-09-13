import type { GameInput } from "../schemas/games.schema";
export type { GameInput } from "../schemas/games.schema";

export interface Game extends Omit<Required<GameInput>, "apiDocsUrl"> {
  guid: string;
  apiDocsUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicGame {
  key: string;
  name: string;
  cardCount: number;
  languages: string[];
}

export interface GameCoverage {
  guid: string;
  key: string;
  name: string;
  isActive: boolean;
  cardCount: number;
  languages: string[];
  lastUpdated: string | null;
}

export interface SampleCard {
  name: string;
  raw: unknown;
}
