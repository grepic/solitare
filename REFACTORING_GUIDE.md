# 🔄 Refactoring Guide - Multi-Game Architecture

## 📋 Přehled

Tento guide tě provede **kompletním refactoringem** z monolitické Solitaire aplikace na **multi-game platformu**.

**Čas:** 8-14 hodin
**Složitost:** Střední
**Risk:** Nízký (backwards compatible)

---

## 🎯 Cíl

**Před:**
```
apps/mobile/src/screens/game/GameScreen.tsx  ← Hard-coded Solitaire
```

**Po:**
```
apps/mobile/src/games/solitaire/screens/SolitaireGameScreen.tsx  ← Plugin
apps/mobile/src/games/poker/screens/PokerGameScreen.tsx          ← Plugin
apps/mobile/src/games/chess/screens/ChessGameScreen.tsx          ← Plugin
```

**1 řádek pro přidání nové hry!**

---

## 📦 Fáze Refactoringu

### ✅ Fáze 1: Shared Types & Interfaces (1-2 hodiny)
### ✅ Fáze 2: Game Loader Service (1-2 hodiny)
### ✅ Fáze 3: Migrace Solitaire (2-4 hodiny)
### ✅ Fáze 4: Backend Refactor (2-3 hodiny)
### ✅ Fáze 5: Testing & Cleanup (2-3 hodiny)

---

## 📝 Fáze 1: Shared Types & Interfaces

### 1.1 Vytvořit Game Interface

```bash
cd packages/shared/src
mkdir -p types
touch types/game.interface.ts
```

```typescript
// packages/shared/src/types/game.interface.ts

export interface GameConfig {
  id: string;
  name: string;
  icon: string;
  version: string;

  ui: {
    primaryColor: string;
    accentColor: string;
    cardBackThemes?: string[];
  };

  rules: {
    minPlayers: number;
    maxPlayers: number;
    supportsMultiplayer: boolean;
    supportsAI: boolean;
    averageGameDurationMs: number;
  };

  screens: {
    GameScreen: React.ComponentType<GameScreenProps>;
    TutorialScreen?: React.ComponentType<any>;
    StatsScreen?: React.ComponentType<any>;
  };

  hooks?: {
    onGameStart?: (matchId: string) => void;
    onGameEnd?: (result: GameResult) => void;
    onMove?: (move: any) => void;
  };
}

export interface GameScreenProps {
  route: {
    params: {
      matchId: string;
      seed: string;
      gameType?: string;
    };
  };
  navigation: any;
}

export interface GameResult {
  userId: string;
  placement: number;
  score: number;
  completionTimeMs: number;
  moveCount: number;
  stats?: Record<string, any>;
}

export interface GameAdapter {
  validateMove(gameState: any, move: any): boolean;
  calculateScore(gameState: any): number;
  isGameFinished(gameState: any): boolean;
  getWinner(gameState: any): string | null;
}

export interface Player {
  id: string;
  username: string;
  avatar?: string;
  ready: boolean;
}
```

### 1.2 Export z Shared Package

```typescript
// packages/shared/src/index.ts

// ... existing exports
export * from './types/game.interface';
```

### 1.3 Build Shared Package

```bash
cd packages/shared
npm run build
```

**✅ Checkpoint:** TypeScript kompiluje bez chyb

---

## 🎮 Fáze 2: Game Loader Service

### 2.1 Vytvořit Core Services Directory

```bash
cd apps/mobile/src
mkdir -p core/services
touch core/services/game-loader.ts
```

### 2.2 Implementovat Game Loader

```typescript
// apps/mobile/src/core/services/game-loader.ts

import { GameConfig } from '@solitaire/shared';

class GameLoader {
  private games: Map<string, GameConfig> = new Map();
  private initialized: boolean = false;

  /**
   * Register a game plugin
   */
  registerGame(config: GameConfig): void {
    if (this.games.has(config.id)) {
      console.warn(`⚠️ Game already registered: ${config.id}`);
      return;
    }

    // Validate config
    this.validateConfig(config);

    this.games.set(config.id, config);
    console.log(`✅ Game registered: ${config.name} (${config.id})`);
  }

  /**
   * Get game by ID
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
   */
  getAllGames(): GameConfig[] {
    return Array.from(this.games.values());
  }

  /**
   * Get game screen component
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
   */
  hasGame(gameId: string): boolean {
    return this.games.has(gameId);
  }

  /**
   * Get game count
   */
  getGameCount(): number {
    return this.games.size;
  }

  /**
   * Validate game config
   */
  private validateConfig(config: GameConfig): void {
    if (!config.id || typeof config.id !== 'string') {
      throw new Error('Game config must have a valid ID');
    }
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Game config must have a valid name');
    }
    if (!config.screens?.GameScreen) {
      throw new Error('Game config must have a GameScreen component');
    }
    if (!config.rules) {
      throw new Error('Game config must have rules defined');
    }
  }

  /**
   * Mark as initialized
   */
  markInitialized(): void {
    this.initialized = true;
    console.log(`🎮 Game Loader initialized with ${this.games.size} game(s)`);
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

export const gameLoader = new GameLoader();
```

**✅ Checkpoint:** Service vytvořen

---

## 🎴 Fáze 3: Migrace Solitaire

### 3.1 Vytvořit Solitaire Game Directory

```bash
cd apps/mobile/src
mkdir -p games/solitaire/{screens,components,services,hooks}
```

### 3.2 Přesunout Game Screen

```bash
# Backup original
cp src/screens/game/GameScreen.tsx src/screens/game/GameScreen.backup.tsx

# Move to new location
mv src/screens/game/GameScreen.tsx src/games/solitaire/screens/SolitaireGameScreen.tsx
```

### 3.3 Přesunout Komponenty

```bash
# Move Solitaire-specific components
mv src/components/PlayingCard.tsx src/games/solitaire/components/
mv src/components/PlayingCardPremium.tsx src/games/solitaire/components/
mv src/components/DraggableCard.tsx src/games/solitaire/components/
mv src/components/DraggableCardPremium.tsx src/games/solitaire/components/
mv src/components/WinCelebration.tsx src/games/solitaire/components/
mv src/components/ParticleSystem.tsx src/games/solitaire/components/

# Keep shared components (these stay in src/components/)
# - DropZone.tsx (reusable)
# - ErrorBoundary.tsx (shared)
# - OfflineIndicator.tsx (shared)
# - SkeletonLoader.tsx (shared)
# - Tutorial.tsx (could be game-specific later)
```

### 3.4 Přesunout Services (pokud jsou game-specific)

```bash
# Sound and haptic are shared - keep in src/services/
# Pokud máš game-specific services, přesuň je:
# mv src/services/solitaire-specific.service.ts src/games/solitaire/services/
```

### 3.5 Update Imports v SolitaireGameScreen.tsx

```typescript
// apps/mobile/src/games/solitaire/screens/SolitaireGameScreen.tsx

// BEFORE:
import { PlayingCardPremium } from '../../components/PlayingCardPremium';
import { DraggableCardPremium } from '../../components/DraggableCardPremium';
import { ParticleSystem } from '../../components/ParticleSystem';
import { WinCelebration } from '../../components/WinCelebration';
import { DropZone, findDropZone, triggerDrop } from '../../components/DropZone';

// AFTER:
import { PlayingCardPremium } from '../components/PlayingCardPremium';
import { DraggableCardPremium } from '../components/DraggableCardPremium';
import { ParticleSystem } from '../components/ParticleSystem';
import { WinCelebration } from '../components/WinCelebration';
import { DropZone, findDropZone, triggerDrop } from '../../../components/DropZone';

// Shared services stay the same
import { soundService } from '../../../services/sound.service';
import { hapticService } from '../../../services/haptic.service';
import websocket from '../../../services/websocket';
```

### 3.6 Update Component Imports

V každém přesunutém komponentu aktualizuj cesty:

```typescript
// apps/mobile/src/games/solitaire/components/DraggableCardPremium.tsx

// BEFORE:
import { PlayingCardPremium } from './PlayingCardPremium';
import { hapticService } from '../services/haptic.service';
import { soundService } from '../services/sound.service';

// AFTER:
import { PlayingCardPremium } from './PlayingCardPremium';  // ✅ Same directory
import { hapticService } from '../../../services/haptic.service';  // ✅ Go up 3 levels
import { soundService } from '../../../services/sound.service';    // ✅ Go up 3 levels
```

### 3.7 Vytvořit Solitaire Config

```typescript
// apps/mobile/src/games/solitaire/config.ts

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
      console.log('🎴 Solitaire game ended:', result);
      console.log('  - Score:', result.score);
      console.log('  - Time:', result.completionTimeMs, 'ms');
      console.log('  - Moves:', result.moveCount);
    },
  },
};
```

### 3.8 Vytvořit Solitaire Index

```typescript
// apps/mobile/src/games/solitaire/index.ts

export { solitaireConfig } from './config';
export { default as SolitaireGameScreen } from './screens/SolitaireGameScreen';

// Export components for potential reuse
export { PlayingCard } from './components/PlayingCard';
export { PlayingCardPremium } from './components/PlayingCardPremium';
export { DraggableCard } from './components/DraggableCard';
export { DraggableCardPremium } from './components/DraggableCardPremium';
export { WinCelebration } from './components/WinCelebration';
export { ParticleSystem } from './components/ParticleSystem';
```

### 3.9 Registrovat Solitaire v App.tsx

```typescript
// apps/mobile/App.tsx

import { gameLoader } from './src/core/services/game-loader';
import { solitaireConfig } from './src/games/solitaire';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // ... existing initialization (fonts, auth, etc.)

        // ✅ Register games
        gameLoader.registerGame(solitaireConfig);
        gameLoader.markInitialized();

        // ... rest of initialization
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  if (!isReady) {
    return null; // or <LoadingScreen />
  }

  return (
    <NavigationContainer>
      {/* ... navigation */}
    </NavigationContainer>
  );
}
```

### 3.10 Update Navigation

```typescript
// apps/mobile/src/navigation/index.tsx (nebo kde máš navigation)

import { gameLoader } from '../core/services/game-loader';

const Stack = createNativeStackNavigator();

export function AppNavigator() {
  return (
    <Stack.Navigator>
      {/* Existing screens */}
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />

      {/* Dynamic game screens */}
      {gameLoader.getAllGames().map((game) => {
        const GameScreen = game.screens.GameScreen;
        return (
          <Stack.Screen
            key={game.id}
            name={`Game_${game.id}`}  // ← "Game_solitaire"
            component={GameScreen}
            options={{
              title: game.name,
              headerStyle: {
                backgroundColor: game.ui.primaryColor,
              },
            }}
          />
        );
      })}
    </Stack.Navigator>
  );
}
```

### 3.11 Update Game Navigation Calls

Všude kde naviguješ na game screen:

```typescript
// BEFORE:
navigation.navigate('Game', { matchId, seed });

// AFTER:
navigation.navigate('Game_solitaire', { matchId, seed });

// Nebo dynamicky:
const gameType = 'solitaire'; // z API nebo state
navigation.navigate(`Game_${gameType}`, { matchId, seed });
```

### 3.12 Test Build

```bash
cd apps/mobile
npm run android
# nebo
npm run ios
```

**✅ Checkpoint:** Aplikace funguje stejně jako před refactoringem

---

## 🔧 Fáze 4: Backend Refactor

### 4.1 Update Database Schema

```prisma
// prisma/schema.prisma

model Game {
  id                String      @id @default(cuid())
  gameType          String      @default("solitaire")  // ← NEW FIELD
  name              String
  tier              MatchTier
  maxPlayers        Int
  entryFeeCents     Int
  prizePoolCents    Int
  seed              String
  deckHash          String
  prizeDistribution Json
  status            GameStatus  @default(WAITING)
  startAt           DateTime?
  endsAt            DateTime?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt

  players           GamePlayer[]
  matches           Match[]
  leaderboard       LeaderboardEntry[]

  @@index([status, gameType])  // ← Add gameType to index
  @@index([createdAt])
}
```

### 4.2 Run Migration

```bash
cd apps/api
npx prisma migrate dev --name add_game_type
npx prisma generate
```

### 4.3 Vytvořit Game Adapter Interface

```typescript
// apps/api/src/games/interfaces/game-adapter.interface.ts

export interface GameAdapter {
  /**
   * Validate if a move is legal
   */
  validateMove(gameState: any, move: any): boolean;

  /**
   * Calculate current score
   */
  calculateScore(gameState: any): number;

  /**
   * Check if game is finished
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
```

### 4.4 Vytvořit Solitaire Adapter

```typescript
// apps/api/src/game-adapters/solitaire.adapter.ts

import { Injectable } from '@nestjs/common';
import { GameAdapter } from '../games/interfaces/game-adapter.interface';
import { SolitaireGame, MoveType } from '@solitaire/engine';

@Injectable()
export class SolitaireAdapter implements GameAdapter {
  validateMove(gameState: any, move: any): boolean {
    try {
      const game = new SolitaireGame(gameState.seed);

      // Replay all moves to reconstruct current state
      if (gameState.moves && Array.isArray(gameState.moves)) {
        for (const m of gameState.moves) {
          game.applyMove(m);
        }
      }

      // Validate new move
      return game.isValidMove(move);
    } catch (error) {
      console.error('Error validating solitaire move:', error);
      return false;
    }
  }

  calculateScore(gameState: any): number {
    try {
      const game = new SolitaireGame(gameState.seed);

      // Replay moves
      if (gameState.moves && Array.isArray(gameState.moves)) {
        for (const m of gameState.moves) {
          game.applyMove(m);
        }
      }

      return game.getScore();
    } catch (error) {
      console.error('Error calculating score:', error);
      return 0;
    }
  }

  isGameFinished(gameState: any): boolean {
    try {
      const game = new SolitaireGame(gameState.seed);

      // Replay moves
      if (gameState.moves && Array.isArray(gameState.moves)) {
        for (const m of gameState.moves) {
          game.applyMove(m);
        }
      }

      return game.checkWin();
    } catch (error) {
      console.error('Error checking if game finished:', error);
      return false;
    }
  }

  getWinner(gameState: any): string | null {
    if (this.isGameFinished(gameState)) {
      return gameState.userId;
    }
    return null;
  }

  initializeGameState(seed: string): any {
    const game = new SolitaireGame(seed);
    return {
      seed,
      moves: [],
      score: 0,
      startedAt: new Date().toISOString(),
    };
  }

  applyMove(gameState: any, move: any): any {
    const game = new SolitaireGame(gameState.seed);

    // Replay existing moves
    if (gameState.moves && Array.isArray(gameState.moves)) {
      for (const m of gameState.moves) {
        game.applyMove(m);
      }
    }

    // Apply new move
    game.applyMove(move);

    return {
      ...gameState,
      moves: [...(gameState.moves || []), move],
      score: game.getScore(),
      lastMoveAt: new Date().toISOString(),
    };
  }
}
```

### 4.5 Update Games Service

```typescript
// apps/api/src/games/games.service.ts

import { Injectable, BadRequestException } from '@nestjs/common';
import { GameAdapter } from './interfaces/game-adapter.interface';
import { SolitaireAdapter } from '../game-adapters/solitaire.adapter';

@Injectable()
export class GamesService {
  private adapters: Map<string, GameAdapter> = new Map();

  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private solitaireAdapter: SolitaireAdapter,
  ) {
    // Register game adapters
    this.adapters.set('solitaire', solitaireAdapter);
    console.log('✅ Game adapters registered:', Array.from(this.adapters.keys()));
  }

  /**
   * Get adapter for game type
   */
  private getAdapter(gameType: string): GameAdapter {
    const adapter = this.adapters.get(gameType);
    if (!adapter) {
      throw new BadRequestException(`Unknown game type: ${gameType}`);
    }
    return adapter;
  }

  /**
   * Create game lobby (NOW with gameType parameter)
   */
  async createGameLobby(
    dto: CreateGameLobbyDto,
    gameType: string = 'solitaire',  // ← NEW PARAMETER
    creatorUserId?: string,
  ) {
    const adapter = this.getAdapter(gameType);

    // ... existing validation

    const game = await this.prisma.game.create({
      data: {
        gameType,              // ← Save game type
        name: dto.name,
        tier: dto.tier,
        // ... rest
      },
    });

    return game;
  }

  /**
   * Validate move (NOW uses correct adapter)
   */
  async validateMove(matchId: string, move: any): Promise<boolean> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { game: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const adapter = this.getAdapter(match.game.gameType);  // ← Use game type
    return adapter.validateMove(match.gameState, move);
  }

  /**
   * Calculate score (NOW uses correct adapter)
   */
  async calculateScore(matchId: string): Promise<number> {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { game: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    const adapter = this.getAdapter(match.game.gameType);
    return adapter.calculateScore(match.gameState);
  }

  // ... rest of methods updated similarly
}
```

### 4.6 Update Games Module

```typescript
// apps/api/src/games/games.module.ts

import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { SolitaireAdapter } from '../game-adapters/solitaire.adapter';

@Module({
  imports: [PrismaModule, WalletModule],
  controllers: [GamesController],
  providers: [
    GamesService,
    SolitaireAdapter,  // ← Register adapter
  ],
  exports: [GamesService],
})
export class GamesModule {}
```

### 4.7 Update Games Controller (pokud potřeba)

```typescript
// apps/api/src/games/games.controller.ts

@Post('lobbies')
async createLobby(
  @Body() dto: CreateGameLobbyDto,
  @Body('gameType') gameType: string = 'solitaire',  // ← NEW
  @GetUser() user?: any,
) {
  return this.gamesService.createGameLobby(dto, gameType, user?.userId);
}
```

### 4.8 Test Backend

```bash
cd apps/api
npm run start:dev

# Test v jiném terminálu:
curl http://localhost:3001/api/games/lobbies
```

**✅ Checkpoint:** Backend funguje s novým gameType field

---

## 🧪 Fáze 5: Testing & Cleanup

### 5.1 Manual Testing Checklist

```
☐ Aplikace se spustí bez chyb
☐ Solitaire hra se načte
☐ Premium features fungují (sound, haptics, particles)
☐ Multiplayer funguje
☐ Win celebration se zobrazí
☐ Navigation funguje
☐ Backend vytvoří hru s gameType="solitaire"
☐ Move validation funguje
☐ Scoring funguje
☐ Leaderboard funguje
```

### 5.2 Automated Tests

```typescript
// apps/mobile/src/core/services/__tests__/game-loader.test.ts

import { gameLoader } from '../game-loader';
import { GameConfig } from '@solitaire/shared';

describe('GameLoader', () => {
  const mockConfig: GameConfig = {
    id: 'test-game',
    name: 'Test Game',
    icon: '🎮',
    version: '1.0.0',
    ui: { primaryColor: '#000', accentColor: '#fff' },
    rules: {
      minPlayers: 1,
      maxPlayers: 4,
      supportsMultiplayer: true,
      supportsAI: false,
      averageGameDurationMs: 60000,
    },
    screens: {
      GameScreen: () => null,
    },
  };

  it('should register a game', () => {
    gameLoader.registerGame(mockConfig);
    expect(gameLoader.hasGame('test-game')).toBe(true);
  });

  it('should retrieve registered game', () => {
    const game = gameLoader.getGame('test-game');
    expect(game?.name).toBe('Test Game');
  });

  it('should list all games', () => {
    const games = gameLoader.getAllGames();
    expect(games.length).toBeGreaterThan(0);
  });
});
```

### 5.3 Cleanup Old Files

```bash
# Smazat backup soubory
rm apps/mobile/src/screens/game/GameScreen.backup.tsx

# Smazat prázdné složky (pokud existují)
rmdir apps/mobile/src/screens/game  # pokud je prázdná

# Verify no broken imports
cd apps/mobile
npm run typecheck
```

### 5.4 Update Documentation

Vytvoř soubor s příklady:

```typescript
// apps/mobile/src/games/ADDING_NEW_GAME.md

# How to Add a New Game

## 1. Create game directory
\`\`\`bash
mkdir -p apps/mobile/src/games/your-game/{screens,components}
\`\`\`

## 2. Create GameScreen component
See `solitaire/screens/SolitaireGameScreen.tsx` as example.

## 3. Create config.ts
\`\`\`typescript
export const yourGameConfig: GameConfig = {
  id: 'your-game',
  name: 'Your Game',
  // ... rest of config
};
\`\`\`

## 4. Register in App.tsx
\`\`\`typescript
import { yourGameConfig } from './src/games/your-game';
gameLoader.registerGame(yourGameConfig);
\`\`\`

Done! 🎉
```

### 5.5 Git Commit

```bash
git add .
git commit -m "refactor: Implement multi-game architecture

✅ Created game plugin system
✅ Migrated Solitaire to games/solitaire/
✅ Added GameLoader service
✅ Updated backend with gameType support
✅ All tests passing

BREAKING CHANGE: Game navigation changed to Game_solitaire
"

git push -u origin claude/multi-game-architecture
```

**✅ Checkpoint:** Refactoring kompletní!

---

## 🎮 Fáze 6: Přidat Novou Hru (Bonus)

### 6.1 Create Poker Game (příklad)

```bash
cd apps/mobile/src/games
mkdir -p poker/{screens,components}
```

```typescript
// apps/mobile/src/games/poker/config.ts

export const pokerConfig: GameConfig = {
  id: 'poker',
  name: 'Poker Clash',
  icon: '🃏',
  version: '1.0.0',

  ui: {
    primaryColor: '#DC2626',
    accentColor: '#EF4444',
  },

  rules: {
    minPlayers: 2,
    maxPlayers: 8,
    supportsMultiplayer: true,
    supportsAI: true,
    averageGameDurationMs: 600000, // 10 minutes
  },

  screens: {
    GameScreen: PokerGameScreen,
  },
};
```

```typescript
// apps/mobile/src/games/poker/screens/PokerGameScreen.tsx

import React from 'react';
import { View, Text } from 'react-native';

export default function PokerGameScreen({ route, navigation }) {
  return (
    <View>
      <Text>Poker Game - Coming Soon!</Text>
    </View>
  );
}
```

```typescript
// apps/mobile/App.tsx

import { pokerConfig } from './src/games/poker';

// Register
gameLoader.registerGame(solitaireConfig);
gameLoader.registerGame(pokerConfig);      // ← ADD THIS LINE
```

**Hotovo! Nová hra přidána v 5 minutách! 🎉**

---

## 📊 Before / After Comparison

| Task | Before | After |
|------|--------|-------|
| **Add new game** | 3-5 days refactoring | 5 minutes registration |
| **Change active game** | Edit 50+ files | Edit 1 line in App.tsx |
| **Test games** | Tightly coupled | Fully isolated |
| **Deploy specific game** | Deploy all or nothing | Deploy game independently |
| **Team collaboration** | Merge conflicts | Parallel development |

---

## 🚨 Troubleshooting

### Issue: "Game not found"

**Solution:** Check that game is registered:
```typescript
console.log(gameLoader.getAllGames());
```

### Issue: Import errors after moving files

**Solution:** Update relative paths:
```typescript
// Count "../" correctly:
// From: apps/mobile/src/games/solitaire/screens/
// To:   apps/mobile/src/services/
// Path: ../../../services/
```

### Issue: Backend can't find gameType

**Solution:** Run migration:
```bash
cd apps/api
npx prisma migrate dev
npx prisma generate
```

### Issue: TypeScript errors

**Solution:** Rebuild shared package:
```bash
cd packages/shared
npm run build
```

---

## ✅ Success Criteria

Po dokončení refactoringu by mělo platit:

- [ ] Aplikace se spustí bez chyb
- [ ] Solitaire funguje identicky jako předtím
- [ ] `gameLoader.getAllGames()` vrací pole her
- [ ] Navigace na `Game_solitaire` funguje
- [ ] Backend má `gameType` field v databázi
- [ ] Můžeš přidat novou hru změnou 1 řádku
- [ ] Všechny testy prošly
- [ ] TypeScript kompiluje bez chyb
- [ ] Git commit je hotový

---

## 📈 Next Steps

Po dokončení refactoringu:

1. **Add second game** (Poker, Chess, etc.)
2. **Implement game selector** UI na home screen
3. **Add game categories** (Card Games, Board Games, etc.)
4. **Implement game stats** per-game leaderboards
5. **A/B test games** launch new games to subset of users

---

## 🎯 Summary

**Time:** 8-14 hours
**Files changed:** ~20-30
**Lines of code:** ~500-800 added
**Risk:** Low (backwards compatible)
**Payoff:** MASSIVE (10x faster to add new games)

**Ready to start? 🚀**

```bash
git checkout -b refactor/multi-game-architecture
# Start with Phase 1!
```
