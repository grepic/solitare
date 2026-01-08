import { GameState, Card, Suit, Rank, Move, MoveType } from './types';

export function getHints(gameState: GameState): Move[] {
  const hints: Move[] = [];

  // Check waste to foundation
  if (gameState.waste.length > 0) {
    const wasteCard = gameState.waste[gameState.waste.length - 1];
    const foundationPile = gameState.foundation[wasteCard.suit];

    if (canPlaceOnFoundation(wasteCard, foundationPile)) {
      hints.push({
        type: MoveType.WASTE_TO_FOUNDATION,
        suit: wasteCard.suit,
      });
    }
  }

  // Check waste to tableau
  if (gameState.waste.length > 0) {
    const wasteCard = gameState.waste[gameState.waste.length - 1];

    gameState.tableau.forEach((pile, index) => {
      if (canPlaceOnTableau(wasteCard, pile)) {
        hints.push({
          type: MoveType.WASTE_TO_TABLEAU,
          to: index,
        });
      }
    });
  }

  // Check tableau to foundation
  gameState.tableau.forEach((pile, fromIndex) => {
    if (pile.length === 0) return;

    const topCard = pile[pile.length - 1];
    if (!topCard.faceUp) return;

    const foundationPile = gameState.foundation[topCard.suit];

    if (canPlaceOnFoundation(topCard, foundationPile)) {
      hints.push({
        type: MoveType.TABLEAU_TO_FOUNDATION,
        from: fromIndex,
        suit: topCard.suit,
      });
    }
  });

  // Check tableau to tableau
  gameState.tableau.forEach((fromPile, fromIndex) => {
    if (fromPile.length === 0) return;

    // Find first face-up card
    const firstFaceUpIndex = fromPile.findIndex(card => card.faceUp);
    if (firstFaceUpIndex === -1) return;

    for (let cardIndex = firstFaceUpIndex; cardIndex < fromPile.length; cardIndex++) {
      const card = fromPile[cardIndex];

      gameState.tableau.forEach((toPile, toIndex) => {
        if (fromIndex === toIndex) return;

        if (canPlaceOnTableau(card, toPile)) {
          hints.push({
            type: MoveType.TABLEAU_TO_TABLEAU,
            from: fromIndex,
            to: toIndex,
            cardCount: fromPile.length - cardIndex,
          });
        }
      });
    }
  });

  // Prioritize moves: foundation > tableau moves that reveal cards > other tableau moves
  return prioritizeHints(hints, gameState);
}

function canPlaceOnFoundation(card: Card, foundationPile: Card[]): boolean {
  if (foundationPile.length === 0) {
    return card.rank === Rank.ACE;
  }

  const topCard = foundationPile[foundationPile.length - 1];
  return card.rank === topCard.rank + 1;
}

function canPlaceOnTableau(card: Card, tableauPile: Card[]): boolean {
  if (tableauPile.length === 0) {
    return card.rank === Rank.KING;
  }

  const topCard = tableauPile[tableauPile.length - 1];
  if (!topCard.faceUp) return false;

  const isOppositeColor = (card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS) !==
    (topCard.suit === Suit.HEARTS || topCard.suit === Suit.DIAMONDS);

  return isOppositeColor && card.rank === topCard.rank - 1;
}

function prioritizeHints(hints: Move[], gameState: GameState): Move[] {
  return hints.sort((a, b) => {
    // Foundation moves are highest priority
    if (a.type === MoveType.TABLEAU_TO_FOUNDATION || a.type === MoveType.WASTE_TO_FOUNDATION) return -1;
    if (b.type === MoveType.TABLEAU_TO_FOUNDATION || b.type === MoveType.WASTE_TO_FOUNDATION) return 1;

    // Moves that reveal face-down cards
    if (a.type === MoveType.TABLEAU_TO_TABLEAU && 'from' in a) {
      const fromPile = gameState.tableau[a.from!];
      const hasHiddenCard = fromPile.some(card => !card.faceUp);
      if (hasHiddenCard) return -1;
    }

    return 0;
  });
}

export function canAutoComplete(gameState: GameState): boolean {
  // Auto-complete is possible when all cards are face-up
  const allFaceUp = gameState.tableau.every(pile =>
    pile.every(card => card.faceUp)
  );

  return allFaceUp && gameState.stock.length === 0;
}

export function getAutoCompleteMoves(gameState: GameState): Move[] {
  const moves: Move[] = [];
  let currentState = { ...gameState };

  while (!isGameWon(currentState)) {
    const hints = getHints(currentState);

    // Only do foundation moves during auto-complete
    const foundationMove = hints.find(
      h => h.type === MoveType.TABLEAU_TO_FOUNDATION || h.type === MoveType.WASTE_TO_FOUNDATION
    );

    if (!foundationMove) break;

    moves.push(foundationMove);

    // Simulate the move
    // This is simplified - in real implementation, use executeMove
    break; // For now, just return one move at a time
  }

  return moves;
}

function isGameWon(gameState: GameState): boolean {
  return Object.values(gameState.foundation).every(pile => pile.length === 13);
}
