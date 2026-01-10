# 🎮 Multi-Game Platform - Master Plan

## 🎯 Vize

**Cíl:** Vytvořit platformu s různými hrami, kde každá hra má:
- ✅ Vlastní standalone aplikaci
- ✅ Sdílené jádro (multi-player, platby, platform fee 10%)
- ✅ Finální mega-app se všemi hrami

**Příklad:**
```
1. Solitaire Smash (samostatná app) ✅
2. Poker Battle (samostatná app)
3. Chess Arena (samostatná app)
4. Puzzle Rush (samostatná app)
5. Game Hub (všechny hry v jedné app) 🎯
```

---

## 📐 Architektura

### Současná Struktura (Monorepo)
```
solitare/
├── apps/
│   ├── api/              # Backend (NestJS)
│   └── mobile/           # Solitaire mobile app
├── packages/
│   ├── shared/           # Společné typy/utils
│   ├── engine/           # Solitaire engine
│   └── ui-kit/           # UI komponenty
```

### Cílová Multi-Game Struktura
```
game-platform/
├── apps/
│   ├── api/                      # 🔥 Hlavní backend (všechny hry)
│   ├── mobile-solitaire/         # Solitaire app
│   ├── mobile-poker/             # Poker app
│   ├── mobile-chess/             # Chess app
│   ├── mobile-puzzle/            # Puzzle app
│   └── mobile-gamehub/           # 🎯 Mega-app (všechny hry)
│
├── packages/
│   ├── core/                     # 🔥 JÁDRO (sdílené mezi všemi)
│   │   ├── auth/                 # Autentizace
│   │   ├── wallet/               # Platby & výběry
│   │   ├── lobby/                # Multi-player lobby systém
│   │   ├── platform-fee/         # 10% platform fee logika
│   │   ├── leaderboard/          # Žebříčky
│   │   ├── compliance/           # Geo-blocking, KYC
│   │   └── websocket/            # Real-time komunikace
│   │
│   ├── game-engines/             # Game-specific logika
│   │   ├── solitaire/            # Solitaire pravidla
│   │   ├── poker/                # Poker pravidla
│   │   ├── chess/                # Chess pravidla
│   │   └── puzzle/               # Puzzle pravidla
│   │
│   ├── ui-kit/                   # Sdílené UI komponenty
│   │   ├── GameCard/
│   │   ├── LobbyBrowser/
│   │   ├── Wallet/
│   │   └── Leaderboard/
│   │
│   └── shared/                   # Typy, konstanty, utils
│       ├── types/
│       ├── constants/
│       └── utils/
```

---

## 🚀 Implementační Fáze

## FÁZE 1: Dokončit Solitaire (Pilot) 🔴 TEĎ

### Krok 1.1: Vyřešit Prisma Blocker
**Priority:** KRITICKÁ
**Čas:** 1-2 hodiny

**Varianty:**
```bash
# A) Získat engines z jiného počítače
scp user@other-machine:/path/to/node_modules/.prisma/client/* \
    /home/user/solitare/apps/api/node_modules/.prisma/client/

# B) Použít Docker s internetem
docker run -v $(pwd):/app -w /app/apps/api node:20 \
  bash -c "npm install && npx prisma generate"

# C) Použít raw SQL wrapper (fallback)
# Vytvořím PrismaService wrapper s raw SQL queries
```

### Krok 1.2: Otestovat Core Features
**Priority:** VYSOKÁ
**Čas:** 2-3 hodiny

**Test checklist:**
- [ ] Vytvořit 4-player hru
- [ ] Připojit 2 zařízení
- [ ] Dokončit hru
- [ ] Ověřit payouts (50%, 30%, 15%, 5%)
- [ ] Ověřit platform fee 10% v admin dashboard
- [ ] Otestovat refunds při cancel
- [ ] Otestovat time-limited tournaments

### Krok 1.3: Production Polish
**Priority:** STŘEDNÍ
**Čas:** 3-4 hodiny

- [ ] Přidat error handling
- [ ] Přidat loading states
- [ ] Přidat toast notifications
- [ ] Welcome bonus UI (optional)
- [ ] Dokumentace API

**Milestone:** ✅ Solitaire Smash je plně funkční

---

## FÁZE 2: Refactor na Multi-Game Architekturu 🟡

### Krok 2.1: Extrahovat Core Package
**Priority:** VYSOKÁ
**Čas:** 1 den

**Co přesunout do `packages/core/`:**

```typescript
// packages/core/src/index.ts
export * from './auth';
export * from './wallet';
export * from './lobby';
export * from './platform-fee';
export * from './leaderboard';
export * from './compliance';
```

**Struktura:**
```
packages/core/
├── src/
│   ├── auth/
│   │   ├── auth.service.ts       # Google/Apple OAuth
│   │   ├── jwt.service.ts
│   │   └── guards/
│   │
│   ├── wallet/
│   │   ├── wallet.service.ts     # Deposit/withdraw
│   │   ├── transaction.service.ts
│   │   └── stripe.service.ts
│   │
│   ├── lobby/
│   │   ├── lobby.service.ts      # Multi-player lobbies
│   │   ├── lobby.gateway.ts      # WebSocket
│   │   └── matchmaking.service.ts
│   │
│   ├── platform-fee/
│   │   ├── fee-calculator.ts     # 10% fee logika
│   │   └── revenue-tracker.ts
│   │
│   ├── leaderboard/
│   │   └── leaderboard.service.ts
│   │
│   └── compliance/
│       ├── geo-blocking.guard.ts
│       ├── age-verification.ts
│       └── responsible-gaming.ts
│
├── package.json
└── tsconfig.json
```

### Krok 2.2: Abstrahovat Game Interface
**Priority:** VYSOKÁ
**Čas:** 4-6 hodin

**Vytvořit game-agnostic interface:**

```typescript
// packages/core/src/game/game.interface.ts

export interface GameEngine {
  id: string;
  name: string;
  description: string;
  icon: string;

  // Game lifecycle
  initialize(config: GameConfig): GameState;
  validateMove(state: GameState, move: Move): boolean;
  applyMove(state: GameState, move: Move): GameState;
  checkWinner(state: GameState): string | null;
  calculateScore(state: GameState, playerId: string): number;

  // Multi-player support
  minPlayers: number;
  maxPlayers: number;
  supportedModes: ('1v1' | 'multi-player' | 'tournament')[];
}

export interface GameConfig {
  tier: MatchTier;
  maxPlayers: number;
  timeLimit?: number;
  customRules?: Record<string, any>;
}

export interface GameState {
  gameId: string;
  players: Player[];
  currentTurn?: string;
  moves: Move[];
  status: 'waiting' | 'active' | 'finished';
  startedAt?: Date;
  finishedAt?: Date;
}
```

**Implementovat pro Solitaire:**
```typescript
// packages/game-engines/solitaire/src/solitaire.engine.ts

export class SolitaireEngine implements GameEngine {
  id = 'solitaire';
  name = 'Solitaire Smash';
  minPlayers = 1;
  maxPlayers = 10;
  supportedModes = ['1v1', 'multi-player', 'tournament'];

  initialize(config: GameConfig): GameState {
    return {
      gameId: nanoid(),
      players: [],
      status: 'waiting',
      // Solitaire-specific state
      deck: createDeck(),
      foundations: [...],
      tableau: [...],
    };
  }

  validateMove(state: GameState, move: Move): boolean {
    // Solitaire pravidla
  }

  // ... další metody
}
```

### Krok 2.3: Update Backend pro Multi-Game
**Priority:** VYSOKÁ
**Čas:** 1 den

```typescript
// apps/api/src/games/games.service.ts

@Injectable()
export class GamesService {
  private gameEngines: Map<string, GameEngine> = new Map();

  constructor(
    @InjectCore() private core: CoreServices,
    @InjectEngine('solitaire') private solitaireEngine: SolitaireEngine,
    // Budoucí hry:
    // @InjectEngine('poker') private pokerEngine: PokerEngine,
    // @InjectEngine('chess') private chessEngine: ChessEngine,
  ) {
    this.registerEngine(solitaireEngine);
  }

  async createGame(dto: CreateGameDto) {
    const engine = this.gameEngines.get(dto.gameType);
    if (!engine) throw new BadRequestException('Unknown game type');

    const gameState = engine.initialize({
      tier: dto.tier,
      maxPlayers: dto.maxPlayers,
    });

    // Použít core lobby service
    return this.core.lobby.createLobby({
      gameType: dto.gameType,
      gameState,
      entryFeeCents: this.calculateEntryFee(dto.tier),
      platformFeeCents: this.core.platformFee.calculate(entryFee), // 10%
    });
  }
}
```

**Milestone:** ✅ Backend podporuje více her

---

## FÁZE 3: Duplikovat pro Další Hry 🟢

### Krok 3.1: Vytvořit Poker App
**Priority:** STŘEDNÍ
**Čas:** 2-3 týdny

**1. Game Engine:**
```bash
# Vytvořit nový engine
mkdir -p packages/game-engines/poker
cd packages/game-engines/poker

# Implementovat GameEngine interface
```

```typescript
// packages/game-engines/poker/src/poker.engine.ts

export class PokerEngine implements GameEngine {
  id = 'poker';
  name = 'Poker Battle';
  minPlayers = 2;
  maxPlayers = 9;
  supportedModes = ['1v1', 'multi-player', 'tournament'];

  initialize(config: GameConfig): GameState {
    return {
      gameId: nanoid(),
      players: [],
      status: 'waiting',
      // Poker-specific
      deck: createPokerDeck(),
      communityCards: [],
      pot: 0,
      currentBet: 0,
    };
  }

  validateMove(state: GameState, move: PokerMove): boolean {
    // Poker pravidla (fold, call, raise, all-in)
  }
}
```

**2. Mobile App:**
```bash
# Duplikovat Solitaire app
cp -r apps/mobile apps/mobile-poker

# Update package.json
{
  "name": "poker-battle",
  "displayName": "Poker Battle",
}

# Update app.json
{
  "name": "PokerBattle",
  "slug": "poker-battle",
  "icon": "./assets/poker-icon.png"
}
```

**3. Game-Specific Screens:**
```typescript
// apps/mobile-poker/src/screens/game/PokerGameScreen.tsx

export function PokerGameScreen() {
  const { gameState } = useGame('poker');

  return (
    <View>
      <CommunityCards cards={gameState.communityCards} />
      <PlayerHand cards={gameState.myCards} />
      <ActionButtons
        onFold={handleFold}
        onCall={handleCall}
        onRaise={handleRaise}
      />
      <PotAmount amount={gameState.pot} />
    </View>
  );
}
```

**4. Použít Core Components:**
```typescript
// Tyto jsou sdílené ze core:
import { LobbyBrowser, WalletWidget, Leaderboard } from '@game-platform/ui-kit';
import { useAuth, useWallet } from '@game-platform/core';
```

**Milestone:** ✅ Poker Battle funguje samostatně

### Krok 3.2: Opakovat pro Další Hry
**Priority:** STŘEDNÍ
**Čas:** 2-3 týdny na hru

**Pro každou novou hru:**
1. Vytvořit game engine (implementovat `GameEngine`)
2. Duplikovat mobile app
3. Vytvořit game-specific UI
4. Použít core komponenty (lobby, wallet, atd.)
5. Registrovat v backend

**Příklady dalších her:**
- ♟️ **Chess Arena** - šachy (2 hráči)
- 🧩 **Puzzle Rush** - skládání obrázků (1-10 hráčů)
- 🃏 **Blackjack Blitz** - blackjack (1-7 hráčů)
- 🎲 **Dice Masters** - kostky (2-6 hráčů)

---

## FÁZE 4: Game Hub (Mega-App) 🎯

### Krok 4.1: Vytvořit Unified App
**Priority:** NÍZKÁ (až když máš 3+ hry)
**Čas:** 1-2 týdny

```bash
# Nová app se všemi hrami
mkdir apps/mobile-gamehub
```

**Struktura:**
```
apps/mobile-gamehub/
├── src/
│   ├── screens/
│   │   ├── home/
│   │   │   └── GameHubScreen.tsx    # Výběr hry
│   │   │
│   │   ├── games/                    # Všechny hry
│   │   │   ├── solitaire/
│   │   │   │   └── SolitaireGameScreen.tsx
│   │   │   ├── poker/
│   │   │   │   └── PokerGameScreen.tsx
│   │   │   ├── chess/
│   │   │   │   └── ChessGameScreen.tsx
│   │   │   └── puzzle/
│   │   │       └── PuzzleGameScreen.tsx
│   │   │
│   │   └── shared/                   # Core screens
│   │       ├── LobbyBrowserScreen.tsx
│   │       ├── WalletScreen.tsx
│   │       └── LeaderboardScreen.tsx
│   │
│   └── navigation/
│       └── GameHubNavigator.tsx      # Unified navigation
```

**GameHubScreen (Výběr Hry):**
```typescript
// apps/mobile-gamehub/src/screens/home/GameHubScreen.tsx

export function GameHubScreen() {
  const games = [
    {
      id: 'solitaire',
      name: 'Solitaire Smash',
      icon: '🃏',
      players: '1-10',
      description: 'Classic solitaire, race to finish!',
    },
    {
      id: 'poker',
      name: 'Poker Battle',
      icon: '🎴',
      players: '2-9',
      description: 'Texas Hold\'em poker tournaments',
    },
    {
      id: 'chess',
      name: 'Chess Arena',
      icon: '♟️',
      players: '2',
      description: 'Blitz chess with real prizes',
    },
    {
      id: 'puzzle',
      name: 'Puzzle Rush',
      icon: '🧩',
      players: '1-10',
      description: 'Solve puzzles faster than opponents',
    },
  ];

  return (
    <ScrollView>
      <Text style={styles.header}>Choose Your Game</Text>
      {games.map((game) => (
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

**Unified Lobby Browser:**
```typescript
// Lobby podporuje všechny hry
export function UnifiedLobbyBrowserScreen() {
  const [selectedGame, setSelectedGame] = useState<string | 'all'>('all');
  const { lobbies } = useLobbyService(selectedGame);

  return (
    <View>
      <GameTabs
        games={['all', 'solitaire', 'poker', 'chess', 'puzzle']}
        selected={selectedGame}
        onSelect={setSelectedGame}
      />

      <LobbyList lobbies={lobbies} />
    </View>
  );
}
```

**Milestone:** ✅ Jedna app se všemi hrami!

---

## FÁZE 5: Deployment & Distribution 🚀

### Krok 5.1: Build System
**Priority:** VYSOKÁ
**Čas:** 2-3 dny

```bash
# Skripty pro build všech app
# package.json v root:

{
  "scripts": {
    "build:api": "cd apps/api && npm run build",

    "build:solitaire": "cd apps/mobile-solitaire && expo build:android && expo build:ios",
    "build:poker": "cd apps/mobile-poker && expo build:android && expo build:ios",
    "build:chess": "cd apps/mobile-chess && expo build:android && expo build:ios",
    "build:gamehub": "cd apps/mobile-gamehub && expo build:android && expo build:ios",

    "build:all": "npm run build:api && npm run build:solitaire && npm run build:poker && npm run build:chess && npm run build:gamehub"
  }
}
```

### Krok 5.2: Backend Deployment
**Priority:** VYSOKÁ

**Jedna API pro všechny hry:**
```bash
# Deploy na server
apps/api/ → https://api.yourgames.com

# Endpoints:
POST /games/create { gameType: 'solitaire', ... }
POST /games/create { gameType: 'poker', ... }
POST /games/create { gameType: 'chess', ... }

# Všechny používají stejný:
- Auth system
- Wallet system
- Platform fee (10%)
- Leaderboards
- Admin dashboard
```

### Krok 5.3: Mobile Deployment
**Priority:** VYSOKÁ

**Google Play Store:**
```
1. com.yourgames.solitaire      → Solitaire Smash
2. com.yourgames.poker          → Poker Battle
3. com.yourgames.chess          → Chess Arena
4. com.yourgames.puzzle         → Puzzle Rush
5. com.yourgames.gamehub        → Game Hub (All-in-One)
```

**Apple App Store:**
```
Stejné bundle IDs
```

**Strategie:**
- **Samostatné apps:** Pro uživatele, kteří chtějí jen jednu hru (menší download)
- **Game Hub:** Pro uživatele, kteří chtějí všechny hry (jeden login, jeden wallet)

---

## 📊 Revenue Model (Pro Všechny Hry)

### Sdílený Platform Fee 10%
```typescript
// packages/core/src/platform-fee/fee-calculator.ts

export class PlatformFeeCalculator {
  private readonly FEE_PERCENTAGE = 10;

  calculateFee(entryFeeCents: number, playerCount: number): number {
    const totalPool = entryFeeCents * playerCount;
    const platformFee = Math.floor(totalPool * (this.FEE_PERCENTAGE / 100));
    return platformFee;
  }

  // Funguje pro VŠECHNY hry!
}
```

**Příklad pro všechny hry:**
```
Solitaire 9 hráčů × $10:
  Total: $90 → Platform: $9 → Prize: $81

Poker 6 hráčů × $25:
  Total: $150 → Platform: $15 → Prize: $135

Chess 2 hráči × $50:
  Total: $100 → Platform: $10 → Prize: $90

Puzzle 8 hráčů × $5:
  Total: $40 → Platform: $4 → Prize: $36
```

**Všechny používají stejný admin dashboard:**
```typescript
// Unified revenue tracking
{
  todayRevenue: $1,234,
  byGame: {
    solitaire: $456,
    poker: $567,
    chess: $123,
    puzzle: $88,
  }
}
```

---

## 🎯 Summary Timeline

### Fáze 1: Solitaire MVP (TEĎ)
**Čas:** 1-2 týdny
- Vyřešit Prisma
- Dokončit testing
- Production ready

### Fáze 2: Multi-Game Refactor
**Čas:** 1-2 týdny
- Extrahovat core package
- Abstrahovat game interface
- Update backend

### Fáze 3: Druhá Hra (Poker)
**Čas:** 2-3 týdny
- Poker engine
- Poker mobile app
- Testing

### Fáze 4: Další Hry
**Čas:** 2-3 týdny / hra
- Chess
- Puzzle
- Další...

### Fáze 5: Game Hub
**Čas:** 1-2 týdny
- Unified app
- Cross-game features

---

## ✅ Checklist - Co Udělat TEĎ

**Immediate (tento týden):**
- [ ] Vyřešit Prisma engines blocker
- [ ] Dokončit Solitaire testing
- [ ] Launch Solitaire jako pilot

**Short-term (tento měsíc):**
- [ ] Refactor na multi-game architekturu
- [ ] Extrahovat core package
- [ ] Design game interface

**Mid-term (příští měsíc):**
- [ ] Implementovat druhou hru (Poker)
- [ ] Test cross-game features
- [ ] Optimize shared code

**Long-term (Q2 2026):**
- [ ] 3-5 her live
- [ ] Game Hub mega-app
- [ ] Cross-platform tournaments

---

**Shrnutí:**
1. ✅ **Teď:** Dokončit Solitaire (pilot)
2. 🔄 **Pak:** Refactor na multi-game core
3. 🎮 **Pak:** Duplikovat pro další hry
4. 🎯 **Nakonec:** Game Hub se všemi hrami

**Revenue:** 10% platform fee sdílený pro VŠECHNY hry! 💰

Chceš abych:
1. Vytvořil detailní refactoring plán pro multi-game?
2. Navrhl konkrétní game interface?
3. Zkusil najít řešení pro Prisma TEĎ?
