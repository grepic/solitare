import { create } from 'zustand';
import { GameState, initializeGame, executeMove, isGameWon, Move, MoveType } from '@solitaire/engine';

interface GameStore {
  gameState: GameState | null;
  matchId: string | null;
  seed: string | null;
  moveSequence: number;
  startTime: number | null;
  isFinished: boolean;

  initGame: (seed: string, matchId: string) => void;
  makeMove: (move: Move) => boolean;
  checkWin: () => boolean;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  matchId: null,
  seed: null,
  moveSequence: 0,
  startTime: null,
  isFinished: false,

  initGame: (seed: string, matchId: string) => {
    const gameState = initializeGame(seed);
    set({
      gameState,
      seed,
      matchId,
      moveSequence: 0,
      startTime: Date.now(),
      isFinished: false,
    });
  },

  makeMove: (move: Move) => {
    const { gameState, moveSequence } = get();
    if (!gameState || get().isFinished) return false;

    const result = executeMove(gameState, move);

    if (result.success && result.newState) {
      set({
        gameState: result.newState,
        moveSequence: moveSequence + 1,
      });
      return true;
    }

    return false;
  },

  checkWin: () => {
    const { gameState } = get();
    if (!gameState) return false;

    const won = isGameWon(gameState);
    if (won) {
      set({ isFinished: true });
    }
    return won;
  },

  reset: () => {
    set({
      gameState: null,
      matchId: null,
      seed: null,
      moveSequence: 0,
      startTime: null,
      isFinished: false,
    });
  },
}));
