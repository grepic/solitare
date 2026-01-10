# 🎯 Immediate Action Plan - Konkrétní Kroky

## 📍 Aktuální Stav
- ✅ 98% kódu hotového
- ✅ Database setup kompletní
- ✅ Multi-player lobby systém implementován
- ✅ Platform fee 10% automatický
- ❌ **BLOCKER:** Prisma Client generation (403 Forbidden)

---

## 🚨 KROK 1: Vyřešit Prisma (DNES)

### Varianta A: Raw SQL Fallback (Nejrychlejší - 2 hodiny) ✅ DOPORUČENO

Vytvořím alternativní PrismaService, který používá přímé SQL queries místo Prisma Client.

**Výhody:**
- ✅ Funguje bez Prisma engines
- ✅ Můžeš testovat TEĎ
- ✅ Žádná závislost na síti
- ✅ Později jednoduše nahradit za normální Prisma

**Co udělám:**
```typescript
// apps/api/src/prisma/prisma-raw.service.ts
// Implementuje stejné metody jako PrismaClient, ale s raw SQL
```

### Varianta B: Získat Engines z Jiného Projektu (1 hodina)
Pokud máš přístup k jinému počítači/serveru s internetem.

### Varianta C: Docker Bridge (30 minut)
Spustit npm install v Dockeru s internetem.

---

## 🧪 KROK 2: Kompletní Testing (3-4 hodiny)

### Test 1: Basic Game Flow ✅
```bash
# 1. Spustit backend
cd apps/api
npm run dev

# 2. Spustit mobile
cd apps/mobile
npm start

# 3. Test v simulátoru
- Registrace
- Deposit $50 (test mode)
- Create 4-player game ($10 entry)
- Join game
- Complete game
- Verify payout
```

### Test 2: Multi-Device ✅
```bash
# Otevřít 2 simulátory:
# iOS: Cmd+Shift+2 (otevřít 2. simulátor)
# Android: AVD Manager → Start 2 emulátory

# Test:
1. Device 1: Create 4-player game
2. Device 2: Browse lobbies → Join
3. Device 1: Check player count updated
4. Complete game on both
5. Verify payouts on both
```

### Test 3: Platform Fee Tracking ✅
```bash
# 1. Complete 5 test games
# 2. Open admin dashboard
# 3. Verify revenue tracking

Expected:
5 games × 4 players × $10 = $200 total
Platform fee (10%) = $20

Check admin dashboard shows:
- Today: $20
- 5 completed games
- Average 4 players/game
```

### Test 4: Edge Cases ✅
```
- Game cancelation (before start)
- Player leave (during game)
- Time-limited tournament expiration
- Insufficient balance
- Max players reached
- Duplicate join attempt
```

---

## 🎨 KROK 3: Polish & Bug Fixes (2-3 hodiny)

### Fix 1: Error Handling
```typescript
// Přidat try-catch všude
// Toast notifications pro errors
// Loading states
```

### Fix 2: UX Improvements
```typescript
// Loading spinners
// Success animations
// Empty states
// Pull to refresh
```

### Fix 3: Performance
```typescript
// Optimize WebSocket reconnection
// Cache lobby list
// Debounce search
```

---

## 📱 KROK 4: Mobile Build (1 hodina)

```bash
# iOS
cd apps/mobile
eas build --platform ios --profile preview

# Android
eas build --platform android --profile preview

# TestFlight / Internal Testing
```

---

## 🚀 KROK 5: Soft Launch (1 den)

### 5.1 Deploy Backend
```bash
# Na VPS/Cloud
pm2 start apps/api/dist/main.js --name solitaire-api
# nebo Docker
docker-compose up -d
```

### 5.2 Submit to Stores
```
Google Play: Internal Testing Track
Apple: TestFlight
```

### 5.3 Invite Beta Testers (10-20 lidí)
```
Test:
- Registration flow
- Deposit (use Stripe test mode)
- Play 5+ games
- Collect feedback
```

---

## 🔄 KROK 6: Refactor na Multi-Game (1-2 týdny)

### 6.1 Přejmenovat Projekt
```bash
# Aktuálně:
solitare/

# Přejmenovat na:
game-platform/
```

### 6.2 Extrahovat Core
```bash
# Vytvořit packages/core/
mkdir -p packages/core/src

# Přesunout:
apps/api/src/auth/        → packages/core/src/auth/
apps/api/src/wallet/      → packages/core/src/wallet/
apps/api/src/games/lobby/ → packages/core/src/lobby/

# Výsledek:
packages/core/
├── src/
│   ├── auth/
│   ├── wallet/
│   ├── lobby/
│   ├── platform-fee/
│   └── index.ts
```

### 6.3 Vytvořit Game Interface
```typescript
// packages/core/src/game/game.interface.ts

export interface GameEngine {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;

  initialize(config: GameConfig): GameState;
  validateMove(state: GameState, move: Move): boolean;
  applyMove(state: GameState, move: Move): GameState;
  checkWinner(state: GameState): string | null;
  calculateScore(state: GameState, playerId: string): number;
}
```

### 6.4 Refactor Solitaire Engine
```typescript
// packages/game-engines/solitaire/src/solitaire.engine.ts

export class SolitaireEngine implements GameEngine {
  id = 'solitaire';
  name = 'Solitaire Smash';
  minPlayers = 1;
  maxPlayers = 10;

  // Implementovat všechny metody
}
```

### 6.5 Update Backend
```typescript
// apps/api/src/games/games.service.ts

@Injectable()
export class GamesService {
  constructor(
    @Inject('GAME_ENGINES') private engines: Map<string, GameEngine>,
  ) {}

  async createGame(gameType: string, config: GameConfig) {
    const engine = this.engines.get(gameType);
    return engine.initialize(config);
  }
}
```

---

## 🎮 KROK 7: Implementovat Druhou Hru (2-3 týdny)

### 7.1 Vybrat Hru
**Doporučené první hry:**
1. **Poker** (Texas Hold'em)
   - Známá hra
   - 2-9 hráčů
   - Vysoký engagement

2. **Chess** (Blitz)
   - 1v1
   - Rychlé hry (5 min)
   - Jednoduchá pravidla

3. **Puzzle Rush**
   - 1-10 hráčů
   - Race mode
   - Jednoduché na implementaci

### 7.2 Implementovat Game Engine
```bash
mkdir -p packages/game-engines/poker
cd packages/game-engines/poker

# Vytvořit:
src/
├── poker.engine.ts       # Implementuje GameEngine
├── poker-rules.ts        # Hand rankings, betting
├── poker-deck.ts         # Deck management
└── index.ts
```

### 7.3 Vytvořit Mobile App
```bash
# Duplikovat Solitaire
cp -r apps/mobile apps/mobile-poker

# Update:
- package.json (name, displayName)
- app.json (name, slug, icon)
- src/screens/game/ (poker-specific UI)

# Zachovat z core:
- Auth screens
- Wallet screens
- Lobby browser
- Leaderboard
```

### 7.4 Registrovat v Backend
```typescript
// apps/api/src/app.module.ts

@Module({
  providers: [
    {
      provide: 'GAME_ENGINES',
      useFactory: () => {
        const engines = new Map();
        engines.set('solitaire', new SolitaireEngine());
        engines.set('poker', new PokerEngine()); // ✅ Nová hra
        return engines;
      },
    },
  ],
})
```

---

## 🎯 KROK 8: Game Hub (Mega-App) (1-2 týdny)

### 8.1 Vytvořit Novou App
```bash
# Založit game hub
npx create-expo-app apps/mobile-gamehub

# nebo duplikovat:
cp -r apps/mobile apps/mobile-gamehub
```

### 8.2 Game Selection Screen
```typescript
// apps/mobile-gamehub/src/screens/GameHubScreen.tsx

export function GameHubScreen() {
  const games = [
    { id: 'solitaire', name: 'Solitaire Smash', icon: '🃏' },
    { id: 'poker', name: 'Poker Battle', icon: '🎴' },
    { id: 'chess', name: 'Chess Arena', icon: '♟️' },
  ];

  return (
    <ScrollView>
      {games.map(game => (
        <GameCard
          key={game.id}
          game={game}
          onPress={() => navigation.navigate('GameLobby', { gameType: game.id })}
        />
      ))}
    </ScrollView>
  );
}
```

### 8.3 Import All Game Screens
```typescript
// apps/mobile-gamehub/src/navigation/index.tsx

import { SolitaireGameScreen } from '../screens/games/solitaire';
import { PokerGameScreen } from '../screens/games/poker';
import { ChessGameScreen } from '../screens/games/chess';

// Dynamický routing:
<Stack.Screen
  name="GameScreen"
  component={({ route }) => {
    const GameScreen = gameScreens[route.params.gameType];
    return <GameScreen />;
  }}
/>
```

---

## 📊 Timeline & Milestones

### Týden 1: Dokončit Solitaire
- [ ] Den 1-2: Vyřešit Prisma
- [ ] Den 3-4: Kompletní testing
- [ ] Den 5: Polish & fixes

**Milestone:** ✅ Solitaire plně funkční

### Týden 2: Soft Launch
- [ ] Den 1: Mobile builds
- [ ] Den 2: Deploy backend
- [ ] Den 3-7: Beta testing

**Milestone:** ✅ První hráči platí peníze

### Týden 3-4: Multi-Game Refactor
- [ ] Extrahovat core
- [ ] Game interface
- [ ] Update Solitaire

**Milestone:** ✅ Připraveno pro další hry

### Týden 5-7: Druhá Hra (Poker)
- [ ] Poker engine
- [ ] Poker mobile
- [ ] Testing

**Milestone:** ✅ 2 hry live

### Týden 8-10: Další Hry
- [ ] Chess
- [ ] Puzzle
- [ ] Další...

**Milestone:** ✅ 3-4 hry live

### Týden 11-12: Game Hub
- [ ] Unified app
- [ ] Cross-game features
- [ ] Launch

**Milestone:** ✅ Mega-app live

---

## 💰 Revenue Projection

### Měsíc 1 (Pouze Solitaire):
```
100 hráčů × 5 her/den × $10 entry = $5,000/den total
Platform fee (10%) = $500/den
Monthly = $15,000
```

### Měsíc 3 (3 hry):
```
Solitaire: 200 hráčů × 5 her × $10 = $10,000/den → $1,000 fee
Poker:     150 hráčů × 3 hry × $25 = $11,250/den → $1,125 fee
Chess:     100 hráčů × 10 her × $5 = $5,000/den → $500 fee

Total daily fee: $2,625
Monthly: $78,750
```

### Měsíc 6 (5+ her + Game Hub):
```
5 her × průměrně $2,000/den fee = $10,000/den
Monthly: $300,000
```

---

## ✅ Okamžité Akce (DNES)

1. **Rozhodnutí o Prisma:**
   - [ ] Varianta A: Raw SQL fallback (2h - můžu udělat TEĎ)
   - [ ] Varianta B: Získat engines odjinud (1h - potřebuješ přístup)
   - [ ] Varianta C: Docker (30min - potřebuješ Docker + síť)

2. **Po vyřešení Prisma:**
   - [ ] Zkompilovat backend
   - [ ] Spustit backend
   - [ ] Otestovat 1 hru end-to-end

3. **Tento týden:**
   - [ ] Kompletní testing suite
   - [ ] Bug fixes
   - [ ] Production ready

---

**Chceš abych:**
1. ✅ **Vytvořil Raw SQL fallback pro Prisma TEĎ?** (2 hodiny, můžeš testovat dnes)
2. Detailně popsal jak získat engines z jiného projektu?
3. Vytvořil konkrétní game interface pro poker?
4. Něco jiného?

**Doporučuji: Varianta 1 - Raw SQL fallback, abys mohl testovat TEĎ!**
