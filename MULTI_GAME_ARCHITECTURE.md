# 🎮 Multi-Game Architecture - Design Document

## 📋 Současný Stav vs. Cílový Stav

### ❌ Současný Problém

**Všechen kód je hard-coded pro Solitaire:**

```
apps/mobile/src/
  ├── screens/game/GameScreen.tsx          ❌ Solitaire-specific
  ├── components/PlayingCard.tsx           ❌ Solitaire-specific
  ├── components/DraggableCard.tsx         ❌ Solitaire-specific
  └── services/websocket.ts                ⚠️ Partially generic

apps/api/src/
  ├── games/games.service.ts               ❌ Hard-coded for Solitaire
  └── match/match.service.ts               ❌ Assumes Solitaire rules

packages/
  └── solitaire-engine/                    ✅ Already separated!
```

**Důsledky:**
- ❌ Nelze přidat novou hru bez rozsáhlého refactoringu
- ❌ Kód je duplicitní a složitě udržovatelný
- ❌ Game logic smíchaná s UI a business logikou
- ❌ Nemožné A/B testovat více her najednou

---

## ✅ Cílová Architektura - Plugin System

### 🎯 Klíčové Principy

1. **Game jako Plugin** - Každá hra je samostatný balíček
2. **Sdílená Infrastruktura** - Backend, auth, payment společné
3. **Hot-swappable** - Změna hry = změna importu
4. **Type-safe** - TypeScript interface pro každou hru
5. **Zero Coupling** - Hry se vzájemně neovlivňují

---

## 📁 Nová Struktura Projektu

```
solitaire-clash/
├── apps/
│   ├── mobile/                           ✅ GENERIC SHELL
│   │   ├── App.tsx                       ← Route registry
│   │   └── src/
│   │       ├── core/                     ← Core features (shared)
│   │       │   ├── navigation/
│   │       │   ├── auth/
│   │       │   ├── payment/
│   │       │   └── services/
│   │       │       ├── game-loader.ts    ← Dynamic game loading
│   │       │       └── websocket.ts
│   │       ├── shared/                   ← Shared components
│   │       │   ├── components/
│   │       │   │   ├── Button.tsx
│   │       │   │   ├── Modal.tsx
│   │       │   │   └── Loader.tsx
│   │       │   └── hooks/
│   │       └── games/                    ← Game instances
│   │           ├── solitaire/            🎴 SOLITAIRE GAME
│   │           │   ├── index.ts          ← Export game config
│   │           │   ├── screens/
│   │           │   │   └── SolitaireGameScreen.tsx
│   │           │   ├── components/
│   │           │   │   ├── PlayingCard.tsx
│   │           │   │   ├── DraggableCard.tsx
│   │           │   │   └── WinCelebration.tsx
│   │           │   ├── services/
│   │           │   │   └── solitaire-game.service.ts
│   │           │   └── config.ts         ← Game metadata
│   │           │
│   │           ├── poker/                🃏 POKER GAME (příklad)
│   │           │   ├── index.ts
│   │           │   ├── screens/
│   │           │   │   └── PokerGameScreen.tsx
│   │           │   └── config.ts
│   │           │
│   │           └── chess/                ♟️ CHESS GAME (příklad)
│   │               ├── index.ts
│   │               ├── screens/
│   │               │   └── ChessGameScreen.tsx
│   │               └── config.ts
│   │
│   └── api/                              ✅ GENERIC BACKEND
│       └── src/
│           ├── games/
│           │   ├── games.controller.ts   ← Generic controller
│           │   ├── games.service.ts      ← Uses game plugins
│           │   └── interfaces/
│           │       └── game-adapter.interface.ts
│           └── game-adapters/            ← Backend game logic
│               ├── solitaire.adapter.ts
│               ├── poker.adapter.ts
│               └── chess.adapter.ts
│
├── packages/
│   ├── games/                            🎮 GAME ENGINE PACKAGES
│   │   ├── solitaire/                    ✅ Already exists!
│   │   │   ├── package.json              ← @solitaire-clash/game-solitaire
│   │   │   └── src/
│   │   │       ├── engine/               ← Pure game logic
│   │   │       │   ├── deck.ts
│   │   │       │   ├── game.ts
│   │   │       │   └── rules.ts
│   │   │       ├── types.ts              ← Game-specific types
│   │   │       └── index.ts
│   │   │
│   │   ├── poker/                        🃏 NEW GAME
│   │   │   ├── package.json              ← @solitaire-clash/game-poker
│   │   │   └── src/
│   │   │       ├── engine/
│   │   │       │   ├── deck.ts
│   │   │       │   ├── hands.ts
│   │   │       │   └── betting.ts
│   │   │       └── types.ts
│   │   │
│   │   └── chess/                        ♟️ NEW GAME
│   │       ├── package.json              ← @solitaire-clash/game-chess
│   │       └── src/
│   │           ├── engine/
│   │           │   ├── board.ts
│   │           │   ├── pieces.ts
│   │           │   └── rules.ts
│   │           └── types.ts
│   │
│   ├── shared/                           ✅ Sdílené utility
│   │   └── src/
│   │       ├── types/
│   │       │   └── game.interface.ts     ← Universal game interface
│   │       └── utils/
│   │
│   └── ui-kit/                           ✅ Sdílené UI komponenty
│       └── src/
│           ├── Button/
│           ├── Card/
│           └── Modal/
│
└── docs/
    ├── ADDING_NEW_GAME.md                ← Jak přidat novou hru
    └── GAME_INTERFACE.md                 ← Interface specification
```

---

## 🔌 Game Plugin Interface

### TypeScript Interface - Universal Contract

Každá hra musí implementovat tento interface:

```typescript
// packages/shared/src/types/game.interface.ts

export interface GameConfig {
  id: string;                             // 'solitaire', 'poker', 'chess'
  name: string;                           // 'Solitaire Clash'
  icon: string;                           // '🎴'
  version: string;                        // '1.0.0'

  // UI Configuration
  ui: {
    primaryColor: string;                 // '#1E40AF'
    accentColor: string;                  // '#60A5FA'
    cardBackThemes: string[];             // ['classic', 'royal', 'neon']
  };

  // Game Rules
  rules: {
    minPlayers: number;                   // 1
    maxPlayers: number;                   // 10
    supportsMultiplayer: boolean;         // true
    supportsAI: boolean;                  // false
    averageGameDurationMs: number;        // 180000 (3 min)
  };

  // Screens
  screens: {
    GameScreen: React.ComponentType<GameScreenProps>;
    TutorialScreen?: React.ComponentType<any>;
    StatsScreen?: React.ComponentType<any>;
  };

  // Hooks & Lifecycle
  hooks?: {
    onGameStart?: (matchId: string) => void;
    onGameEnd?: (result: GameResult) => void;
    onMove?: (move: any) => void;
  };
}

export interface GameScreenProps {
  matchId: string;
  seed: string;
  players: Player[];
  navigation: any;
  onGameEnd: (result: GameResult) => void;
}

export interface GameResult {
  userId: string;
  placement: number;
  score: number;
  completionTimeMs: number;
  moveCount: number;
  stats?: Record<string, any>;           // Game-specific stats
}

export interface GameAdapter {
  // Backend adapter for game validation
  validateMove(gameState: any, move: any): boolean;
  calculateScore(gameState: any): number;
  isGameFinished(gameState: any): boolean;
  getWinner(gameState: any): string | null;
}
```

---

## 🎴 Příklad - Solitaire Game Plugin

### 1. Game Configuration

```typescript
// apps/mobile/src/games/solitaire/config.ts

import { GameConfig } from '@solitaire-clash/shared';
import { SolitaireGameScreen } from './screens/SolitaireGameScreen';

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
      console.log('Solitaire game started:', matchId);
    },
    onGameEnd: (result) => {
      console.log('Solitaire game ended:', result);
    },
  },
};
```

### 2. Game Export

```typescript
// apps/mobile/src/games/solitaire/index.ts

export { solitaireConfig } from './config';
export { SolitaireGameScreen } from './screens/SolitaireGameScreen';
export * from './components';
export * from './services';
```

### 3. Backend Adapter

```typescript
// apps/api/src/game-adapters/solitaire.adapter.ts

import { Injectable } from '@nestjs/common';
import { GameAdapter } from '@solitaire-clash/shared';
import { SolitaireEngine } from '@solitaire-clash/game-solitaire';

@Injectable()
export class SolitaireAdapter implements GameAdapter {
  validateMove(gameState: any, move: any): boolean {
    const engine = new SolitaireEngine(gameState.seed);
    // Replay moves to current state
    gameState.moves.forEach(m => engine.applyMove(m));
    // Validate new move
    return engine.isValidMove(move);
  }

  calculateScore(gameState: any): number {
    const engine = new SolitaireEngine(gameState.seed);
    gameState.moves.forEach(m => engine.applyMove(m));
    return engine.getScore();
  }

  isGameFinished(gameState: any): boolean {
    const engine = new SolitaireEngine(gameState.seed);
    gameState.moves.forEach(m => engine.applyMove(m));
    return engine.checkWin();
  }

  getWinner(gameState: any): string | null {
    if (this.isGameFinished(gameState)) {
      return gameState.userId;
    }
    return null;
  }
}
```

---

## 🔄 Game Loader Service

### Dynamic Game Loading

```typescript
// apps/mobile/src/core/services/game-loader.ts

import { GameConfig } from '@solitaire-clash/shared';

class GameLoader {
  private games: Map<string, GameConfig> = new Map();

  // Register a game
  registerGame(config: GameConfig) {
    this.games.set(config.id, config);
    console.log(`✅ Game registered: ${config.name} (${config.id})`);
  }

  // Get game by ID
  getGame(gameId: string): GameConfig | undefined {
    return this.games.get(gameId);
  }

  // List all games
  getAllGames(): GameConfig[] {
    return Array.from(this.games.values());
  }

  // Get game screen component
  getGameScreen(gameId: string): React.ComponentType<any> | undefined {
    const game = this.games.get(gameId);
    return game?.screens.GameScreen;
  }
}

export const gameLoader = new GameLoader();
```

---

## 📱 App.tsx - Game Registry

### Registrace Her

```typescript
// apps/mobile/App.tsx

import { gameLoader } from './src/core/services/game-loader';

// Import game plugins
import { solitaireConfig } from './src/games/solitaire';
import { pokerConfig } from './src/games/poker';
import { chessConfig } from './src/games/chess';

// Register all games
gameLoader.registerGame(solitaireConfig);
gameLoader.registerGame(pokerConfig);    // ← Přidat novou hru
gameLoader.registerGame(chessConfig);     // ← Přidat novou hru

export default function App() {
  // ... rest of app setup
}
```

---

## 🎮 Navigation - Dynamic Game Routes

```typescript
// apps/mobile/src/core/navigation/index.tsx

import { gameLoader } from '../services/game-loader';

const Stack = createNativeStackNavigator();

export function GameNavigator() {
  return (
    <Stack.Navigator>
      {/* Dynamic game routes */}
      {gameLoader.getAllGames().map((game) => {
        const GameScreen = game.screens.GameScreen;
        return (
          <Stack.Screen
            key={game.id}
            name={`Game_${game.id}`}
            component={GameScreen}
            options={{ title: game.name }}
          />
        );
      })}
    </Stack.Navigator>
  );
}
```

---

## 🏠 Home Screen - Game Selector

```typescript
// apps/mobile/src/screens/main/HomeScreen.tsx

import { gameLoader } from '../../core/services/game-loader';

export function HomeScreen({ navigation }) {
  const games = gameLoader.getAllGames();

  return (
    <ScrollView>
      <Text style={styles.title}>Vyber Hru</Text>

      {games.map((game) => (
        <TouchableOpacity
          key={game.id}
          onPress={() => navigation.navigate(`Game_${game.id}`)}
          style={[styles.gameCard, { borderColor: game.ui.primaryColor }]}
        >
          <Text style={styles.icon}>{game.icon}</Text>
          <Text style={styles.gameName}>{game.name}</Text>
          <Text style={styles.players}>
            {game.rules.minPlayers}-{game.rules.maxPlayers} players
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}
```

---

## 🔧 Backend - Generic Games Service

```typescript
// apps/api/src/games/games.service.ts

import { Injectable } from '@nestjs/common';
import { GameAdapter } from '@solitaire-clash/shared';
import { SolitaireAdapter } from '../game-adapters/solitaire.adapter';
import { PokerAdapter } from '../game-adapters/poker.adapter';

@Injectable()
export class GamesService {
  private adapters: Map<string, GameAdapter> = new Map();

  constructor(
    private solitaireAdapter: SolitaireAdapter,
    private pokerAdapter: PokerAdapter,
  ) {
    // Register game adapters
    this.adapters.set('solitaire', solitaireAdapter);
    this.adapters.set('poker', pokerAdapter);
  }

  async createGame(gameType: string, dto: CreateGameDto) {
    const adapter = this.adapters.get(gameType);
    if (!adapter) {
      throw new BadRequestException(`Unknown game type: ${gameType}`);
    }

    // Generic game creation
    const game = await this.prisma.game.create({
      data: {
        gameType,              // ← New field!
        name: dto.name,
        tier: dto.tier,
        // ... rest
      },
    });

    return game;
  }

  async validateMove(gameId: string, move: any) {
    const game = await this.prisma.game.findUnique({ where: { id: gameId } });
    const adapter = this.adapters.get(game.gameType);

    return adapter.validateMove(game.state, move);
  }
}
```

---

## 📊 Database Schema Update

### Přidat `gameType` field

```prisma
// prisma/schema.prisma

model Game {
  id            String      @id @default(cuid())
  gameType      String      @default("solitaire")  // ← NEW!
  name          String
  tier          MatchTier
  maxPlayers    Int
  // ... rest
}

model Match {
  id            String      @id @default(cuid())
  gameId        String
  game          Game        @relation(fields: [gameId], references: [id])
  // ... rest
}
```

---

## 🚀 Jak Přidat Novou Hru - Krok za Krokem

### 1. Vytvořit Game Engine (5-10 hodin)

```bash
cd packages/games
mkdir poker
cd poker
npm init -y
```

```typescript
// packages/games/poker/src/engine/game.ts

export class PokerEngine {
  private deck: Card[];
  private hands: Map<string, Card[]>;

  constructor(seed: string) {
    this.deck = this.shuffleDeck(seed);
    this.hands = new Map();
  }

  dealHand(playerId: string): Card[] {
    const hand = this.deck.splice(0, 5);
    this.hands.set(playerId, hand);
    return hand;
  }

  evaluateHand(hand: Card[]): HandRank {
    // Poker hand evaluation logic
  }
}
```

### 2. Vytvořit Mobile Game (10-15 hodin)

```bash
cd apps/mobile/src/games
mkdir poker
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
  },
  screens: {
    GameScreen: PokerGameScreen,
  },
};
```

### 3. Vytvořit Backend Adapter (2-3 hodiny)

```typescript
// apps/api/src/game-adapters/poker.adapter.ts

@Injectable()
export class PokerAdapter implements GameAdapter {
  validateMove(gameState: any, move: any): boolean {
    // Poker-specific validation
  }

  calculateScore(gameState: any): number {
    // Poker-specific scoring
  }
}
```

### 4. Registrovat Hru (5 minut)

```typescript
// apps/mobile/App.tsx

import { pokerConfig } from './src/games/poker';
gameLoader.registerGame(pokerConfig);  // ← Přidat tento řádek
```

```typescript
// apps/api/src/games/games.module.ts

import { PokerAdapter } from '../game-adapters/poker.adapter';

@Module({
  providers: [
    GamesService,
    SolitaireAdapter,
    PokerAdapter,        // ← Přidat
  ],
})
export class GamesModule {}
```

**Hotovo! 🎉**

---

## 📈 Migrace Současného Kódu

### Fáze 1: Přesunout Solitaire do `games/solitaire/`

```bash
# 1. Vytvořit strukturu
mkdir -p apps/mobile/src/games/solitaire/{screens,components,services}

# 2. Přesunout soubory
mv apps/mobile/src/screens/game/GameScreen.tsx \
   apps/mobile/src/games/solitaire/screens/SolitaireGameScreen.tsx

mv apps/mobile/src/components/PlayingCard*.tsx \
   apps/mobile/src/games/solitaire/components/

mv apps/mobile/src/components/DraggableCard*.tsx \
   apps/mobile/src/games/solitaire/components/

mv apps/mobile/src/components/WinCelebration.tsx \
   apps/mobile/src/games/solitaire/components/

mv apps/mobile/src/components/ParticleSystem.tsx \
   apps/mobile/src/games/solitaire/components/
```

### Fáze 2: Vytvořit Game Config

```typescript
// apps/mobile/src/games/solitaire/config.ts
// (viz výše)
```

### Fáze 3: Update Imports

```typescript
// apps/mobile/src/games/solitaire/screens/SolitaireGameScreen.tsx

// Before:
import { PlayingCardPremium } from '../../components/PlayingCardPremium';

// After:
import { PlayingCardPremium } from '../components/PlayingCardPremium';
```

### Fáze 4: Register Game

```typescript
// apps/mobile/App.tsx
import { solitaireConfig } from './src/games/solitaire';
gameLoader.registerGame(solitaireConfig);
```

### Fáze 5: Update Backend

```typescript
// apps/api/src/games/games.service.ts
// Add gameType parameter to all methods
```

**Čas: ~2-4 hodiny pro kompletní migraci**

---

## 🎯 Výhody Nové Architektury

| Aspekt | Před | Po |
|--------|------|-----|
| **Přidat novou hru** | 3-5 dní refactoringu | 15-20 hodin development |
| **Změna hry** | Změna 50+ souborů | Změna 1 řádku v App.tsx |
| **Testování** | Složité, propojené | Izolované, jednoduché |
| **Škálování** | Nemožné | Neomezené |
| **Maintenance** | Vysoká složitost | Nízká složitost |
| **Team collaboration** | Konflikty | Paralelní vývoj |

---

## 📦 Package Dependencies

```json
// packages/games/solitaire/package.json
{
  "name": "@solitaire-clash/game-solitaire",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@solitaire-clash/shared": "workspace:*"
  }
}

// packages/games/poker/package.json
{
  "name": "@solitaire-clash/game-poker",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "dependencies": {
    "@solitaire-clash/shared": "workspace:*"
  }
}
```

---

## 🔒 Type Safety

```typescript
// Compile-time check že všechny hry implementují interface
import { GameConfig } from '@solitaire-clash/shared';

export const pokerConfig: GameConfig = {  // ← TypeScript validuje
  id: 'poker',
  // Pokud chybí povinné pole, TypeScript vyhodí error!
};
```

---

## 🧪 Testing

```typescript
// packages/games/solitaire/__tests__/engine.test.ts

describe('SolitaireEngine', () => {
  it('should initialize deck correctly', () => {
    const engine = new SolitaireEngine('test-seed');
    expect(engine.getDeck().length).toBe(52);
  });
});
```

**Každá hra má vlastní testy - zero interference!**

---

## 🎨 UI Theming per Game

```typescript
// apps/mobile/src/games/solitaire/config.ts

ui: {
  primaryColor: '#1E40AF',    // Blue for Solitaire
  accentColor: '#60A5FA',
}

// apps/mobile/src/games/poker/config.ts

ui: {
  primaryColor: '#DC2626',    // Red for Poker
  accentColor: '#EF4444',
}
```

**Každá hra má vlastní barevné schéma!**

---

## 📝 Summary

### ✅ Co Získáš

1. **Hot-swappable games** - Změna hry = 1 řádek kódu
2. **Zero coupling** - Hry se neovlivňují
3. **Parallel development** - Více týmů pracuje zároveň
4. **Easy testing** - Každá hra izolovaně testovatelná
5. **Scalable** - 10 her, 100 her - stejná složitost
6. **Type-safe** - Compile-time validace
7. **Maintainable** - Jasná struktura, snadná orientace

### 📊 Effort Estimation

- **Migrace Solitaire**: 2-4 hodiny
- **Game Loader Service**: 1-2 hodiny
- **Backend Refactor**: 2-3 hodiny
- **Testing**: 2-3 hodiny
- **Documentation**: 1-2 hodiny

**Total: 8-14 hodin práce**

---

## 🚦 Next Steps

1. **Review tento dokument** s týmem
2. **Approve architekturu**
3. **Začít s migrací Solitaire** (Fáze 1)
4. **Implementovat Game Loader**
5. **Přidat první novou hru** (Poker nebo Chess)

**Chceš začít s migrací? 🚀**
