/**
 * Game Loader Service
 *
 * Manages game plugin registration and retrieval.
 * Supports dynamic multi-game architecture.
 */

import { GameConfig } from '@solitaire/shared';

class GameLoader {
  private games: Map<string, GameConfig> = new Map();
  private initialized: boolean = false;

  /**
   * Register a game plugin
   *
   * @param config - Game configuration object
   * @throws Error if config is invalid
   */
  registerGame(config: GameConfig): void {
    // Check if already registered
    if (this.games.has(config.id)) {
      console.warn(`⚠️ Game already registered: ${config.id}`);
      return;
    }

    // Validate config
    this.validateConfig(config);

    // Register game
    this.games.set(config.id, config);
    console.log(`✅ Game registered: ${config.name} (${config.id})`);
  }

  /**
   * Get game configuration by ID
   *
   * @param gameId - Unique game identifier
   * @returns Game config or undefined if not found
   */
  getGame(gameId: string): GameConfig | undefined {
    const game = this.games.get(gameId);
    if (!game) {
      console.error(`❌ Game not found: ${gameId}`);
    }
    return game;
  }

  /**
   * Get all registered games
   *
   * @returns Array of all game configs
   */
  getAllGames(): GameConfig[] {
    return Array.from(this.games.values());
  }

  /**
   * Get game screen component by game ID
   *
   * @param gameId - Unique game identifier
   * @returns React component or undefined
   * @throws Error if game not found
   */
  getGameScreen(gameId: string): React.ComponentType<any> | undefined {
    const game = this.games.get(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }
    return game.screens.GameScreen;
  }

  /**
   * Check if game exists
   *
   * @param gameId - Unique game identifier
   * @returns True if game is registered
   */
  hasGame(gameId: string): boolean {
    return this.games.has(gameId);
  }

  /**
   * Get number of registered games
   *
   * @returns Game count
   */
  getGameCount(): number {
    return this.games.size;
  }

  /**
   * Validate game configuration
   *
   * @param config - Game config to validate
   * @throws Error if config is invalid
   */
  private validateConfig(config: GameConfig): void {
    if (!config.id || typeof config.id !== 'string') {
      throw new Error('Game config must have a valid ID (string)');
    }

    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Game config must have a valid name (string)');
    }

    if (!config.screens?.GameScreen) {
      throw new Error('Game config must have a GameScreen component');
    }

    if (!config.rules) {
      throw new Error('Game config must have rules defined');
    }

    if (typeof config.rules.minPlayers !== 'number' || config.rules.minPlayers < 1) {
      throw new Error('Game config must have valid minPlayers (number >= 1)');
    }

    if (typeof config.rules.maxPlayers !== 'number' || config.rules.maxPlayers < config.rules.minPlayers) {
      throw new Error('Game config must have valid maxPlayers (number >= minPlayers)');
    }

    if (!config.ui?.primaryColor || !config.ui?.accentColor) {
      throw new Error('Game config must have ui.primaryColor and ui.accentColor');
    }
  }

  /**
   * Mark game loader as initialized
   */
  markInitialized(): void {
    this.initialized = true;
    const count = this.games.size;
    const gameNames = Array.from(this.games.values()).map(g => g.name).join(', ');
    console.log(`🎮 Game Loader initialized with ${count} game(s): ${gameNames}`);
  }

  /**
   * Check if game loader is initialized
   *
   * @returns True if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reset game loader (for testing)
   */
  reset(): void {
    this.games.clear();
    this.initialized = false;
    console.log('🔄 Game Loader reset');
  }
}

// Export singleton instance
export const gameLoader = new GameLoader();
