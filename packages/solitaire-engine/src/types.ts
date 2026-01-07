export enum Suit {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES',
}

export enum Rank {
  ACE = 1,
  TWO = 2,
  THREE = 3,
  FOUR = 4,
  FIVE = 5,
  SIX = 6,
  SEVEN = 7,
  EIGHT = 8,
  NINE = 9,
  TEN = 10,
  JACK = 11,
  QUEEN = 12,
  KING = 13,
}

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

export interface GameState {
  stock: Card[];
  waste: Card[];
  tableau: Card[][];
  foundation: {
    [Suit.HEARTS]: Card[];
    [Suit.DIAMONDS]: Card[];
    [Suit.CLUBS]: Card[];
    [Suit.SPADES]: Card[];
  };
  moveCount: number;
  score: number;
}

export interface MoveResult {
  success: boolean;
  newState?: GameState;
  error?: string;
}

export enum MoveType {
  DRAW = 'DRAW',
  STOCK_TO_WASTE = 'STOCK_TO_WASTE',
  WASTE_TO_TABLEAU = 'WASTE_TO_TABLEAU',
  WASTE_TO_FOUNDATION = 'WASTE_TO_FOUNDATION',
  TABLEAU_TO_FOUNDATION = 'TABLEAU_TO_FOUNDATION',
  TABLEAU_TO_TABLEAU = 'TABLEAU_TO_TABLEAU',
  FOUNDATION_TO_TABLEAU = 'FOUNDATION_TO_TABLEAU',
  FLIP_TABLEAU = 'FLIP_TABLEAU',
}

export interface Move {
  type: MoveType;
  from?: number;
  to?: number;
  cardCount?: number;
  suit?: Suit;
}
