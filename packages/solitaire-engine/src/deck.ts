import seedrandom from 'seedrandom';
import { Card, Rank, Suit } from './types';

/**
 * Creates a standard 52-card deck
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];
  const ranks = [
    Rank.ACE,
    Rank.TWO,
    Rank.THREE,
    Rank.FOUR,
    Rank.FIVE,
    Rank.SIX,
    Rank.SEVEN,
    Rank.EIGHT,
    Rank.NINE,
    Rank.TEN,
    Rank.JACK,
    Rank.QUEEN,
    Rank.KING,
  ];

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank, faceUp: false });
    }
  }

  return deck;
}

/**
 * Fisher-Yates shuffle with seeded random generator
 * This ensures both players get the identical deck layout
 */
export function shuffleDeck(deck: Card[], seed: string): Card[] {
  const shuffled = [...deck];
  const rng = seedrandom(seed);

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
}

/**
 * Generates a cryptographic hash of the deck for audit purposes
 */
export function hashDeck(deck: Card[]): string {
  const deckString = deck
    .map((card) => `${card.suit}-${card.rank}`)
    .join('|');

  // Simple hash for demo - in production use crypto.createHash
  let hash = 0;
  for (let i = 0; i < deckString.length; i++) {
    const char = deckString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

/**
 * Card color helper
 */
export function isRed(suit: Suit): boolean {
  return suit === Suit.HEARTS || suit === Suit.DIAMONDS;
}

/**
 * Check if two cards have opposite colors
 */
export function isOppositeColor(card1: Card, card2: Card): boolean {
  return isRed(card1.suit) !== isRed(card2.suit);
}
