# 🎮 Jak Přidat Novou Hru - Quick Start Guide

## ⏱️ Čas: 15-20 hodin (celá hra od nuly)

---

## 🚀 Quick Start - 3 Kroky

### 1️⃣ Vytvoř Game Engine (5-10 hodin)

```bash
cd packages/games
mkdir your-game
cd your-game
npm init -y
```

**package.json:**
```json
{
  "name": "@solitaire-clash/game-your-game",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "@solitaire-clash/shared": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.0.0"
  }
}
```

**src/types.ts:**
```typescript
export interface YourGameState {
  // Define your game state
  currentPlayer: string;
  board: any;
  score: number;
}

export interface YourGameMove {
  type: 'MOVE' | 'ACTION';
  from: any;
  to: any;
  // ... your move structure
}
```

**src/engine/game.ts:**
```typescript
export class YourGameEngine {
  private state: YourGameState;

  constructor(seed: string) {
    // Initialize game with deterministic seed
    this.state = this.initializeGame(seed);
  }

  private initializeGame(seed: string): YourGameState {
    // Use seed for deterministic setup
    return {
      currentPlayer: 'player1',
      board: this.createBoard(seed),
      score: 0,
    };
  }

  isValidMove(move: YourGameMove): boolean {
    // Validate move against rules
    return true;
  }

  applyMove(move: YourGameMove): void {
    // Update game state
  }

  getScore(): number {
    return this.state.score;
  }

  checkWin(): boolean {
    // Check if game is won
    return false;
  }

  getState(): YourGameState {
    return this.state;
  }
}
```

---

### 2️⃣ Vytvoř Mobile UI (10-15 hodin)

```bash
cd apps/mobile/src/games
mkdir -p your-game/{screens,components,services}
```

**config.ts:**
```typescript
// apps/mobile/src/games/your-game/config.ts

import { GameConfig } from '@solitaire/shared';
import YourGameScreen from './screens/YourGameScreen';

export const yourGameConfig: GameConfig = {
  id: 'your-game',
  name: 'Your Game Clash',
  icon: '🎮',  // Choose your emoji
  version: '1.0.0',

  ui: {
    primaryColor: '#8B5CF6',    // Purple
    accentColor: '#A78BFA',
    cardBackThemes: [],  // If applicable
  },

  rules: {
    minPlayers: 1,
    maxPlayers: 4,
    supportsMultiplayer: true,
    supportsAI: false,
    averageGameDurationMs: 300000,  // 5 minutes
  },

  screens: {
    GameScreen: YourGameScreen,
  },

  hooks: {
    onGameStart: (matchId) => {
      console.log('🎮 Your game started:', matchId);
    },
    onGameEnd: (result) => {
      console.log('🎮 Your game ended:', result);
    },
  },
};
```

**screens/YourGameScreen.tsx:**
```typescript
// apps/mobile/src/games/your-game/screens/YourGameScreen.tsx

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { YourGameEngine } from '@solitaire-clash/game-your-game';
import { soundService } from '../../../services/sound.service';
import { hapticService } from '../../../services/haptic.service';
import websocket from '../../../services/websocket';

interface YourGameScreenProps {
  route: {
    params: {
      matchId: string;
      seed: string;
    };
  };
  navigation: any;
}

export default function YourGameScreen({ route, navigation }: YourGameScreenProps) {
  const { matchId, seed } = route.params;
  const [gameEngine, setGameEngine] = useState<YourGameEngine | null>(null);
  const [gameState, setGameState] = useState<any>(null);

  // Initialize game
  useEffect(() => {
    const engine = new YourGameEngine(seed);
    setGameEngine(engine);
    setGameState(engine.getState());

    // Setup WebSocket listeners
    websocket.on('OPPONENT_MOVE', (data) => {
      if (data.matchId === matchId) {
        handleOpponentMove(data.move);
      }
    });

    return () => {
      websocket.off('OPPONENT_MOVE');
    };
  }, [matchId, seed]);

  // Handle player move
  const handleMove = (move: any) => {
    if (!gameEngine) return;

    if (gameEngine.isValidMove(move)) {
      // Apply move locally
      gameEngine.applyMove(move);
      setGameState(gameEngine.getState());

      // Send to server
      websocket.emit('MOVE', {
        matchId,
        move,
        score: gameEngine.getScore(),
      });

      // Feedback
      soundService.playCardSnap();
      hapticService.cardDrop();

      // Check win
      if (gameEngine.checkWin()) {
        handleWin();
      }
    } else {
      // Invalid move
      soundService.playErrorBuzz();
      hapticService.invalidMove();
    }
  };

  // Handle opponent move
  const handleOpponentMove = (move: any) => {
    if (!gameEngine) return;
    gameEngine.applyMove(move);
    setGameState(gameEngine.getState());
  };

  // Handle win
  const handleWin = () => {
    soundService.playWinFanfare();
    hapticService.winCelebration();

    websocket.emit('GAME_COMPLETE', {
      matchId,
      completionTimeMs: Date.now() - startTime,
      finalScore: gameEngine?.getScore() || 0,
      moveCount: moveCount,
    });

    // Show win modal
    setTimeout(() => {
      navigation.navigate('Home');
    }, 3000);
  };

  if (!gameState) {
    return (
      <View style={styles.loading}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#1E1B4B', '#312E81', '#4C1D95']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Your Game</Text>
        <Text style={styles.score}>Score: {gameState.score}</Text>
      </View>

      <View style={styles.gameBoard}>
        {/* Render your game UI here */}
        <Text style={styles.placeholder}>
          🎮 Implement your game UI here
        </Text>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleMove({ type: 'MOVE' })}
        >
          <Text style={styles.buttonText}>Make Move</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
  },
  score: {
    fontSize: 24,
    color: '#A78BFA',
    marginTop: 10,
  },
  gameBoard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholder: {
    fontSize: 18,
    color: 'white',
    textAlign: 'center',
  },
  actionButton: {
    marginTop: 40,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

**index.ts:**
```typescript
// apps/mobile/src/games/your-game/index.ts

export { yourGameConfig } from './config';
export { default as YourGameScreen } from './screens/YourGameScreen';
```

---

### 3️⃣ Registruj v App.tsx (1 minuta)

```typescript
// apps/mobile/App.tsx

import { gameLoader } from './src/core/services/game-loader';
import { solitaireConfig } from './src/games/solitaire';
import { yourGameConfig } from './src/games/your-game';  // ← Import

export default function App() {
  useEffect(() => {
    async function prepare() {
      // ... initialization

      // Register games
      gameLoader.registerGame(solitaireConfig);
      gameLoader.registerGame(yourGameConfig);  // ← Register
      gameLoader.markInitialized();

      // ...
    }
    prepare();
  }, []);

  // ...
}
```

---

## 🎉 Hotovo!

Tvoje nová hra je připravená! Spusť aplikaci:

```bash
cd apps/mobile
npx expo start
```

Naviguj na hru:
```typescript
navigation.navigate('Game_your-game', { matchId, seed });
```

---

## 🔧 Backend Adapter (Volitelné - Pro Validaci)

Pokud chceš server-side validaci tahů:

```typescript
// apps/api/src/game-adapters/your-game.adapter.ts

import { Injectable } from '@nestjs/common';
import { GameAdapter } from '../games/interfaces/game-adapter.interface';
import { YourGameEngine } from '@solitaire-clash/game-your-game';

@Injectable()
export class YourGameAdapter implements GameAdapter {
  validateMove(gameState: any, move: any): boolean {
    const engine = new YourGameEngine(gameState.seed);

    // Replay moves
    if (gameState.moves) {
      gameState.moves.forEach(m => engine.applyMove(m));
    }

    return engine.isValidMove(move);
  }

  calculateScore(gameState: any): number {
    const engine = new YourGameEngine(gameState.seed);

    if (gameState.moves) {
      gameState.moves.forEach(m => engine.applyMove(m));
    }

    return engine.getScore();
  }

  isGameFinished(gameState: any): boolean {
    const engine = new YourGameEngine(gameState.seed);

    if (gameState.moves) {
      gameState.moves.forEach(m => engine.applyMove(m));
    }

    return engine.checkWin();
  }

  getWinner(gameState: any): string | null {
    if (this.isGameFinished(gameState)) {
      return gameState.userId;
    }
    return null;
  }

  initializeGameState(seed: string): any {
    return {
      seed,
      moves: [],
      score: 0,
      startedAt: new Date().toISOString(),
    };
  }

  applyMove(gameState: any, move: any): any {
    const engine = new YourGameEngine(gameState.seed);

    if (gameState.moves) {
      gameState.moves.forEach(m => engine.applyMove(m));
    }

    engine.applyMove(move);

    return {
      ...gameState,
      moves: [...(gameState.moves || []), move],
      score: engine.getScore(),
      lastMoveAt: new Date().toISOString(),
    };
  }
}
```

**Registruj adapter:**

```typescript
// apps/api/src/games/games.service.ts

constructor(
  private solitaireAdapter: SolitaireAdapter,
  private yourGameAdapter: YourGameAdapter,  // ← Inject
) {
  this.adapters.set('solitaire', solitaireAdapter);
  this.adapters.set('your-game', yourGameAdapter);  // ← Register
}
```

```typescript
// apps/api/src/games/games.module.ts

providers: [
  GamesService,
  SolitaireAdapter,
  YourGameAdapter,  // ← Add
],
```

---

## 📊 Příklady Her - Inspiration

### 🃏 Poker

**Engine:**
- Deck shuffling (deterministic)
- Hand evaluation (Royal Flush, Straight, etc.)
- Betting logic
- Showdown

**UI:**
- 5 card display
- Bet/Fold/Call buttons
- Pot display
- Opponent hands

**Time:** 15-20 hodin

---

### ♟️ Chess

**Engine:**
- Board representation (8x8)
- Piece movement validation
- Check/Checkmate detection
- En passant, castling

**UI:**
- Chessboard render
- Drag & drop pieces
- Move highlighting
- Captured pieces

**Time:** 20-30 hodin (complex rules)

---

### 🎲 Yahtzee

**Engine:**
- Dice rolling (deterministic)
- Score categories
- Combo validation

**UI:**
- 5 dice display
- Tap to hold dice
- Score sheet
- Roll button

**Time:** 8-12 hodin

---

### 🎯 Darts

**Engine:**
- Trajectory calculation
- Score zones
- 501/301 game modes

**UI:**
- Dartboard render
- Swipe to throw
- Score tracking

**Time:** 10-15 hodin

---

## 🎨 UI Components - Reusable

### Použij Existující Komponenty

```typescript
// From shared
import { Button } from '../../../shared/components/Button';
import { Modal } from '../../../shared/components/Modal';
import { Loader } from '../../../shared/components/Loader';

// From services
import { soundService } from '../../../services/sound.service';
import { hapticService } from '../../../services/haptic.service';

// From Solitaire (if applicable)
import { ParticleSystem } from '../../solitaire/components/ParticleSystem';
import { WinCelebration } from '../../solitaire/components/WinCelebration';
```

---

## ✅ Checklist - Před Publikací

```
☐ Game engine implementován
☐ Unit testy napsány (min 80% coverage)
☐ Mobile UI dokončeno
☐ Zvuky přidány
☐ Haptická odezva přidána
☐ Multiplayer testován
☐ Win/Lose flow funguje
☐ Backend adapter vytvořen (volitelné)
☐ Documentation napsána
☐ Screenshots vytvořeny
☐ Icon vybrán
☐ Tutorial screen vytvořen (doporučeno)
```

---

## 🚀 Deployment

1. **Test locally:**
   ```bash
   npx expo start
   ```

2. **Build & test:**
   ```bash
   npx expo build:android
   npx expo build:ios
   ```

3. **Deploy backend:**
   ```bash
   # Backend má automaticky podporu pro novou hru!
   # Jen ověř že adapter je registrovaný
   ```

4. **Submit to stores:**
   - Přidej screenshots nové hry
   - Update app description

---

## 💡 Pro Tips

### 1. Start Simple
Nejdřív implementuj základní verzi:
- ✅ Core rules
- ✅ Basic UI
- ❌ Advanced features
- ❌ AI opponents
- ❌ Custom themes

Advanced features přidáš později!

### 2. Reuse Components
Copyruj z Solitaire a upravuj:
- ParticleSystem
- WinCelebration
- Sound/Haptic services

### 3. Deterministic Seeding
**CRITICAL:** Použij seed pro všechny random operace!

```typescript
// ❌ BAD - non-deterministic
const shuffled = deck.sort(() => Math.random() - 0.5);

// ✅ GOOD - deterministic
const rng = new SeededRandom(seed);
const shuffled = deck.sort(() => rng.next() - 0.5);
```

### 4. Test Multiplayer Early
Hned otestuj s 2+ hráči - odhalíš race conditions!

### 5. Performance
- Use `React.memo` pro komponenty
- Optimalizuj re-renders
- Profile s React DevTools

---

## 🐛 Common Issues

### Issue: "Game not registered"
**Fix:** Ujisti se že `gameLoader.registerGame()` je voláno v `App.tsx`

### Issue: Desync between players
**Fix:** Seed musí být stejný pro všechny! Server posílá seed při vytvoření match.

### Issue: Random results differ
**Fix:** Použij seeded RNG, ne `Math.random()` přímo

---

## 📚 Resources

- **Solitaire Example:** `apps/mobile/src/games/solitaire/`
- **Architecture Doc:** `MULTI_GAME_ARCHITECTURE.md`
- **Refactoring Guide:** `REFACTORING_GUIDE.md`
- **Game Interface:** `packages/shared/src/types/game.interface.ts`

---

## 🎯 Summary

| Krok | Čas | Složitost |
|------|-----|-----------|
| Game Engine | 5-10h | Medium-High |
| Mobile UI | 10-15h | Medium |
| Backend Adapter | 2-3h | Low |
| Testing | 2-3h | Low |
| **TOTAL** | **15-25h** | **Medium** |

**Po dokončení refactoringu na multi-game architekturu je přidání nové hry SNADNÉ! 🚀**

---

Máš otázky? Koukni na Solitaire implementaci jako referenci!

```bash
cd apps/mobile/src/games/solitaire
# Study the code!
```

**Happy Coding! 🎮**
