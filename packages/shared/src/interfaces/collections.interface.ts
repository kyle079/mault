import type { Game } from "./games.interface";
import type { Result } from "./result.interface";
import type { ScannedCard } from "./scanner.interface";

export interface Collection {
  guid: string;
  name: string;
  isActive: boolean;
  cardCount: number;
  game: Game | null;
  lang: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionWithCards extends Collection {
  cards: ScannedCard[];
}

export type CardImage = Pick<ScannedCard, "capturedImageUrl">;
export type AddCollectionCardResult = Result<ScannedCard> & {
  scanLimitReached?: boolean;
  binLimitReached?: boolean;
  binNumber?: number;
};
