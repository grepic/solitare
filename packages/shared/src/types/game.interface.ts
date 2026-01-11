/**
 * Universal Game Plugin Interface
 *
 * Every game must implement this interface to be compatible
 * with the multi-game platform.
 */

export interface GameConfig {
  /** Unique game identifier (e.g., 'solitaire', 'poker') */
  id: string;

  /** Display name (e.g., 'Solitaire Clash') */
  name: string;

  /** Emoji icon for UI (e.g., '🎴') */
  icon: string;

  /** Game version */
  version: string;

  /** UI configuration */
  ui: {
    /** Primary brand color */
    primaryColor: string;

    /** Accent color */
    accentColor: string;

    /** Optional card back themes */
    cardBackThemes?: string[];
  };

  /** Game rules and constraints */
  rules: {
    /** Minimum number of players */
    minPlayers: number;

    /** Maximum number of players */
    maxPlayers: number;

    /** Supports multiplayer mode */
    supportsMultiplayer: boolean;

    /** Supports AI opponents */
    supportsAI: boolean;

    /** Average game duration in milliseconds */
    averageGameDurationMs: number;
  };

  /** Screen components */
  screens: {
    /** Main game screen component */
    GameScreen: React.ComponentType<GameScreenProps>;

    /** Optional tutorial screen */
    TutorialScreen?: React.ComponentType<any>;

    /** Optional stats screen */
    StatsScreen?: React.ComponentType<any>;
  };

  /** Optional lifecycle hooks */
  hooks?: {
    /** Called when game starts */
    onGameStart?: (matchId: string) => void;

    /** Called when game ends */
    onGameEnd?: (result: GameResult) => void;

    /** Called on each move */
    onMove?: (move: any) => void;
  };
}

/**
 * Props passed to every GameScreen component
 */
export interface GameScreenProps {
  route: {
    params: {
      /** Match identifier */
      matchId: string;

      /** Deterministic seed for game initialization */
      seed: string;

      /** Optional game type (for multi-game support) */
      gameType?: string;
    };
  };

  /** React Navigation object */
  navigation: any;
}

/**
 * Result object returned when game ends
 */
export interface GameResult {
  /** User ID of the player */
  userId: string;

  /** Final placement (1 = winner, 2 = second, etc.) */
  placement: number;

  /** Final score */
  score: number;

  /** Time to complete in milliseconds */
  completionTimeMs: number;

  /** Number of moves made */
  moveCount: number;

  /** Optional game-specific statistics */
  stats?: Record<string, any>;
}

/**
 * Player object
 */
export interface Player {
  /** Player ID */
  id: string;

  /** Username */
  username: string;

  /** Optional avatar URL */
  avatar?: string;

  /** Ready status */
  ready: boolean;
}

/**
 * Backend Game Adapter Interface
 *
 * Each game should implement a backend adapter for server-side
 * validation and scoring (optional but recommended for anti-cheat)
 */
export interface GameAdapter {
  /**
   * Validate if a move is legal
   */
  validateMove(gameState: any, move: any): boolean;

  /**
   * Calculate current score from game state
   */
  calculateScore(gameState: any): number;

  /**
   * Check if game has finished
   */
  isGameFinished(gameState: any): boolean;

  /**
   * Get winner user ID (if game finished)
   */
  getWinner(gameState: any): string | null;

  /**
   * Initialize game state from seed
   */
  initializeGameState(seed: string): any;

  /**
   * Apply a move to game state
   */
  applyMove(gameState: any, move: any): any;
}
