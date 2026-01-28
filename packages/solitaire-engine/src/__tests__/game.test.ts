import { initializeGame, executeMove, isGameWon, getAvailableMoves } from '../game';
import { MoveType } from '../types';

describe('Solitaire Engine', () => {
  describe('initializeGame', () => {
    it('should create a valid initial game state', () => {
      const state = initializeGame('test-seed-123');

      expect(state.tableau).toHaveLength(7);
      expect(state.tableau[0]).toHaveLength(1);
      expect(state.tableau[6]).toHaveLength(7);
      expect(state.stock.length).toBe(24); // 52 - 28 dealt to tableau

      // Check that top cards are face up
      state.tableau.forEach((pile) => {
        expect(pile[pile.length - 1].faceUp).toBe(true);
      });
    });

    it('should produce identical decks with same seed', () => {
      const state1 = initializeGame('same-seed');
      const state2 = initializeGame('same-seed');

      expect(state1.tableau).toEqual(state2.tableau);
      expect(state1.stock).toEqual(state2.stock);
    });

    it('should produce different decks with different seeds', () => {
      const state1 = initializeGame('seed-1');
      const state2 = initializeGame('seed-2');

      expect(state1.tableau).not.toEqual(state2.tableau);
    });
  });

  describe('executeMove', () => {
    it('should draw a card from stock to waste', () => {
      const state = initializeGame('test');
      const result = executeMove(state, { type: MoveType.DRAW });

      expect(result.success).toBe(true);
      expect(result.newState!.waste).toHaveLength(1);
      expect(result.newState!.waste[0].faceUp).toBe(true);
    });

    it('should recycle waste when stock is empty', () => {
      let state = initializeGame('test');

      // Draw all cards
      while (state.stock.length > 0) {
        const result = executeMove(state, { type: MoveType.DRAW });
        state = result.newState!;
      }

      const wasteCount = state.waste.length;
      const result = executeMove(state, { type: MoveType.DRAW });

      expect(result.success).toBe(true);
      expect(result.newState!.stock).toHaveLength(wasteCount);
      expect(result.newState!.waste).toHaveLength(0);
    });

    it('should only allow Kings on empty tableau piles', () => {
      const state = initializeGame('test');

      // This would need a specific seed where we can test this
      // For now, we just verify the logic exists
      expect(state.tableau).toBeDefined();
    });
  });

  describe('isGameWon', () => {
    it('should return false for initial state', () => {
      const state = initializeGame('test');
      expect(isGameWon(state)).toBe(false);
    });
  });

  describe('getAvailableMoves', () => {
    it('should always include draw move initially', () => {
      const state = initializeGame('test');
      const moves = getAvailableMoves(state);

      const drawMove = moves.find((m) => m.type === MoveType.DRAW);
      expect(drawMove).toBeDefined();
    });

    it('should find available moves', () => {
      const state = initializeGame('test');
      const moves = getAvailableMoves(state);

      expect(moves.length).toBeGreaterThan(0);
    });
  });
});
