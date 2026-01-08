import { Card, GameState, Move, MoveResult, MoveType, Rank, Suit } from './types';
import { createDeck, shuffleDeck, isOppositeColor } from './deck';

/**
 * Initialize a new Klondike Solitaire game with a seed
 */
export function initializeGame(seed: string): GameState {
  const deck = createDeck();
  const shuffled = shuffleDeck(deck, seed);

  const state: GameState = {
    stock: [],
    waste: [],
    tableau: [[], [], [], [], [], [], []],
    foundation: {
      [Suit.HEARTS]: [],
      [Suit.DIAMONDS]: [],
      [Suit.CLUBS]: [],
      [Suit.SPADES]: [],
    },
    moveCount: 0,
    score: 0,
  };

  // Deal to tableau: 1 card to first pile, 2 to second, etc.
  let cardIndex = 0;
  for (let pile = 0; pile < 7; pile++) {
    for (let card = 0; card <= pile; card++) {
      const currentCard = { ...shuffled[cardIndex] };
      // Only the top card is face up
      currentCard.faceUp = card === pile;
      state.tableau[pile].push(currentCard);
      cardIndex++;
    }
  }

  // Remaining cards go to stock
  state.stock = shuffled.slice(cardIndex).map((card) => ({ ...card, faceUp: false }));

  return state;
}

/**
 * Execute a move and return the new state
 */
export function executeMove(state: GameState, move: Move): MoveResult {
  const newState = cloneState(state);

  try {
    switch (move.type) {
      case MoveType.DRAW:
        return executeDraw(newState);

      case MoveType.WASTE_TO_TABLEAU:
        return executeWasteToTableau(newState, move.to!);

      case MoveType.WASTE_TO_FOUNDATION:
        return executeWasteToFoundation(newState, move.suit!);

      case MoveType.TABLEAU_TO_FOUNDATION:
        return executeTableauToFoundation(newState, move.from!, move.suit!);

      case MoveType.TABLEAU_TO_TABLEAU:
        return executeTableauToTableau(newState, move.from!, move.to!, move.cardCount!);

      case MoveType.FOUNDATION_TO_TABLEAU:
        return executeFoundationToTableau(newState, move.suit!, move.to!);

      case MoveType.FLIP_TABLEAU:
        return executeFlipTableau(newState, move.from!);

      default:
        return { success: false, error: 'Invalid move type' };
    }
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

function executeDraw(state: GameState): MoveResult {
  if (state.stock.length === 0) {
    // Recycle waste back to stock
    if (state.waste.length === 0) {
      return { success: false, error: 'No cards to draw' };
    }
    state.stock = state.waste.reverse().map((card) => ({ ...card, faceUp: false }));
    state.waste = [];
  } else {
    // Draw 1 card (can be changed to 3 for harder mode)
    const card = state.stock.pop()!;
    card.faceUp = true;
    state.waste.push(card);
  }

  state.moveCount++;
  return { success: true, newState: state };
}

function executeWasteToTableau(state: GameState, tableauIndex: number): MoveResult {
  if (state.waste.length === 0) {
    return { success: false, error: 'Waste pile is empty' };
  }

  const card = state.waste[state.waste.length - 1];
  const targetPile = state.tableau[tableauIndex];

  if (!canPlaceOnTableau(card, targetPile)) {
    return { success: false, error: 'Invalid placement' };
  }

  state.waste.pop();
  state.tableau[tableauIndex].push(card);
  state.moveCount++;
  state.score += 5;

  return { success: true, newState: state };
}

function executeWasteToFoundation(state: GameState, suit: Suit): MoveResult {
  if (state.waste.length === 0) {
    return { success: false, error: 'Waste pile is empty' };
  }

  const card = state.waste[state.waste.length - 1];

  if (!canPlaceOnFoundation(card, state.foundation[suit])) {
    return { success: false, error: 'Cannot place on foundation' };
  }

  state.waste.pop();
  state.foundation[suit].push(card);
  state.moveCount++;
  state.score += 10;

  return { success: true, newState: state };
}

function executeTableauToFoundation(
  state: GameState,
  tableauIndex: number,
  suit: Suit,
): MoveResult {
  const pile = state.tableau[tableauIndex];
  if (pile.length === 0) {
    return { success: false, error: 'Tableau pile is empty' };
  }

  const card = pile[pile.length - 1];

  if (!card.faceUp || !canPlaceOnFoundation(card, state.foundation[suit])) {
    return { success: false, error: 'Cannot place on foundation' };
  }

  pile.pop();
  state.foundation[suit].push(card);
  state.moveCount++;
  state.score += 10;

  // Flip the next card if available
  if (pile.length > 0 && !pile[pile.length - 1].faceUp) {
    pile[pile.length - 1].faceUp = true;
    state.score += 5;
  }

  return { success: true, newState: state };
}

function executeTableauToTableau(
  state: GameState,
  fromIndex: number,
  toIndex: number,
  cardCount: number,
): MoveResult {
  const fromPile = state.tableau[fromIndex];
  const toPile = state.tableau[toIndex];

  if (fromPile.length < cardCount) {
    return { success: false, error: 'Not enough cards in source pile' };
  }

  const cards = fromPile.slice(-cardCount);

  // Check if first card being moved is face up
  if (!cards[0].faceUp) {
    return { success: false, error: 'Cannot move face-down cards' };
  }

  // Validate sequence: cards must be in alternating colors and descending ranks
  for (let i = 0; i < cards.length - 1; i++) {
    const currentCard = cards[i];
    const nextCard = cards[i + 1];

    if (!isOppositeColor(currentCard, nextCard) || currentCard.rank - 1 !== nextCard.rank) {
      return { success: false, error: 'Invalid card sequence' };
    }
  }

  // Check if we can place the bottom card of the sequence
  if (!canPlaceOnTableau(cards[0], toPile)) {
    return { success: false, error: 'Invalid placement' };
  }

  // Move the cards
  state.tableau[fromIndex] = fromPile.slice(0, -cardCount);
  state.tableau[toIndex] = [...toPile, ...cards];
  state.moveCount++;

  // Flip the next card in source pile if available
  const newFromPile = state.tableau[fromIndex];
  if (newFromPile.length > 0 && !newFromPile[newFromPile.length - 1].faceUp) {
    newFromPile[newFromPile.length - 1].faceUp = true;
    state.score += 5;
  }

  return { success: true, newState: state };
}

function executeFoundationToTableau(state: GameState, suit: Suit, toIndex: number): MoveResult {
  const foundation = state.foundation[suit];
  if (foundation.length === 0) {
    return { success: false, error: 'Foundation pile is empty' };
  }

  const card = foundation[foundation.length - 1];
  const targetPile = state.tableau[toIndex];

  if (!canPlaceOnTableau(card, targetPile)) {
    return { success: false, error: 'Invalid placement' };
  }

  foundation.pop();
  state.tableau[toIndex].push(card);
  state.moveCount++;
  state.score -= 15; // Penalty for moving from foundation

  return { success: true, newState: state };
}

function executeFlipTableau(state: GameState, tableauIndex: number): MoveResult {
  const pile = state.tableau[tableauIndex];

  if (pile.length === 0) {
    return { success: false, error: 'Tableau pile is empty' };
  }

  const topCard = pile[pile.length - 1];

  if (topCard.faceUp) {
    return { success: false, error: 'Card is already face up' };
  }

  topCard.faceUp = true;
  state.score += 5;
  state.moveCount++;

  return { success: true, newState: state };
}

/**
 * Check if a card can be placed on a tableau pile
 */
function canPlaceOnTableau(card: Card, targetPile: Card[]): boolean {
  if (targetPile.length === 0) {
    // Only Kings can be placed on empty tableau piles
    return card.rank === Rank.KING;
  }

  const topCard = targetPile[targetPile.length - 1];

  // Must be opposite color and one rank lower
  return isOppositeColor(card, topCard) && card.rank === topCard.rank - 1;
}

/**
 * Check if a card can be placed on a foundation pile
 */
function canPlaceOnFoundation(card: Card, foundation: Card[]): boolean {
  if (card.suit !== getSuitFromFoundation(foundation)) {
    return false;
  }

  if (foundation.length === 0) {
    return card.rank === Rank.ACE;
  }

  const topCard = foundation[foundation.length - 1];
  return card.rank === topCard.rank + 1;
}

function getSuitFromFoundation(foundation: Card[]): Suit | null {
  if (foundation.length === 0) return null;
  return foundation[0].suit;
}

/**
 * Check if the game is won
 */
export function isGameWon(state: GameState): boolean {
  return (
    state.foundation[Suit.HEARTS].length === 13 &&
    state.foundation[Suit.DIAMONDS].length === 13 &&
    state.foundation[Suit.CLUBS].length === 13 &&
    state.foundation[Suit.SPADES].length === 13
  );
}

/**
 * Get available moves (for hints)
 */
export function getAvailableMoves(state: GameState): Move[] {
  const moves: Move[] = [];

  // Draw move
  if (state.stock.length > 0 || state.waste.length > 0) {
    moves.push({ type: MoveType.DRAW });
  }

  // Waste to tableau/foundation
  if (state.waste.length > 0) {
    const wasteCard = state.waste[state.waste.length - 1];

    for (let i = 0; i < 7; i++) {
      if (canPlaceOnTableau(wasteCard, state.tableau[i])) {
        moves.push({ type: MoveType.WASTE_TO_TABLEAU, to: i });
      }
    }

    if (canPlaceOnFoundation(wasteCard, state.foundation[wasteCard.suit])) {
      moves.push({ type: MoveType.WASTE_TO_FOUNDATION, suit: wasteCard.suit });
    }
  }

  // Tableau moves
  for (let from = 0; from < 7; from++) {
    const pile = state.tableau[from];
    if (pile.length === 0) continue;

    const topCard = pile[pile.length - 1];

    // Tableau to foundation
    if (topCard.faceUp && canPlaceOnFoundation(topCard, state.foundation[topCard.suit])) {
      moves.push({ type: MoveType.TABLEAU_TO_FOUNDATION, from, suit: topCard.suit });
    }

    // Tableau to tableau
    for (let cardCount = 1; cardCount <= pile.length; cardCount++) {
      const cards = pile.slice(-cardCount);
      if (!cards[0].faceUp) break;

      for (let to = 0; to < 7; to++) {
        if (to === from) continue;
        if (canPlaceOnTableau(cards[0], state.tableau[to])) {
          moves.push({ type: MoveType.TABLEAU_TO_TABLEAU, from, to, cardCount });
        }
      }
    }
  }

  return moves;
}

function cloneState(state: GameState): GameState {
  return {
    stock: state.stock.map((card) => ({ ...card })),
    waste: state.waste.map((card) => ({ ...card })),
    tableau: state.tableau.map((pile) => pile.map((card) => ({ ...card }))),
    foundation: {
      [Suit.HEARTS]: state.foundation[Suit.HEARTS].map((card) => ({ ...card })),
      [Suit.DIAMONDS]: state.foundation[Suit.DIAMONDS].map((card) => ({ ...card })),
      [Suit.CLUBS]: state.foundation[Suit.CLUBS].map((card) => ({ ...card })),
      [Suit.SPADES]: state.foundation[Suit.SPADES].map((card) => ({ ...card })),
    },
    moveCount: state.moveCount,
    score: state.score,
  };
}
