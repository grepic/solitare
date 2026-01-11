/**
 * Solitaire Game Configuration
 *
 * Defines Solitaire as a game plugin for the multi-game platform.
 */

import { GameConfig } from '@solitaire/shared';
import SolitaireGameScreen from './screens/SolitaireGameScreen';

export const solitaireConfig: GameConfig = {
  id: 'solitaire',
  name: 'Solitaire Clash',
  icon: '🎴',
  version: '1.0.0',

  ui: {
    primaryColor: '#1E40AF',
    accentColor: '#60A5FA',
    cardBackThemes: ['classic', 'royal', 'neon', 'galaxy', 'gold'],
  },

  rules: {
    minPlayers: 1,
    maxPlayers: 10,
    supportsMultiplayer: true,
    supportsAI: false,
    averageGameDurationMs: 180000, // 3 minutes
  },

  screens: {
    GameScreen: SolitaireGameScreen,
  },

  hooks: {
    onGameStart: (matchId) => {
      console.log('🎴 Solitaire game started:', matchId);
    },
    onGameEnd: (result) => {
      console.log('🎴 Solitaire game completed:', {
        placement: result.placement,
        score: result.score,
        time: `${(result.completionTimeMs / 1000).toFixed(1)}s`,
        moves: result.moveCount,
      });
    },
  },
};
