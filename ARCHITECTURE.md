# Architecture Documentation

## System Overview

Solitaire Smash is a skill-based real-money gaming platform built on a **modular monorepo architecture** designed for scalability and future expansion into a multi-game hub.

## High-Level Architecture

```
┌─────────────────┐          ┌──────────────────┐
│  Mobile App     │◄────────►│   API Gateway    │
│  (React Native) │  HTTPS   │   (NestJS)       │
└─────────────────┘          └──────────────────┘
                                      │
                     ┌────────────────┼────────────────┐
                     ▼                ▼                ▼
              ┌──────────┐     ┌──────────┐    ┌──────────┐
              │PostgreSQL│     │  Redis   │    │  Stripe  │
              │   (DB)   │     │ (Cache)  │    │(Payments)│
              └──────────┘     └──────────┘    └──────────┘
```

## Monorepo Structure

```
solitare/
├── apps/
│   ├── mobile/              # React Native + Expo
│   │   ├── src/
│   │   │   ├── screens/     # UI screens
│   │   │   ├── navigation/  # React Navigation
│   │   │   ├── services/    # API, WebSocket clients
│   │   │   └── store/       # Zustand state management
│   │   └── App.tsx
│   │
│   └── api/                 # NestJS Backend
│       ├── src/
│       │   ├── auth/        # Authentication module
│       │   ├── user/        # User management
│       │   ├── wallet/      # Wallet & transactions
│       │   ├── match/       # Match logic
│       │   ├── websocket/   # WebSocket gateway
│       │   ├── stripe/      # Stripe integration
│       │   └── admin/       # Admin endpoints
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── shared/              # Shared types & DTOs
│   │   ├── types/
│   │   ├── dto/
│   │   └── constants/
│   │
│   ├── ui-kit/              # Design system
│   │   ├── theme.ts
│   │   └── components/
│   │
│   ├── solitaire-engine/    # Pure game logic
│   │   ├── deck.ts
│   │   ├── game.ts
│   │   └── types.ts
│   │
│   └── games/
│       └── solitaire/       # Game adapter (future)
│
└── docker-compose.yml
```

## Technology Stack

### Mobile App

- **Framework**: React Native 0.73 + Expo
- **Navigation**: React Navigation 6
- **State Management**: Zustand
- **API Client**: Axios
- **WebSocket**: Socket.io-client
- **Payments**: @stripe/stripe-react-native
- **Styling**: Custom design system (UI Kit)

### Backend API

- **Framework**: NestJS 10
- **Language**: TypeScript 5
- **Database**: PostgreSQL 16 + Prisma ORM
- **Cache**: Redis 7 (ioredis)
- **WebSocket**: Socket.io
- **Authentication**: JWT (access + refresh)
- **Payments**: Stripe SDK
- **Validation**: Zod + class-validator
- **Security**: Argon2, Rate limiting

### Infrastructure

- **Database**: PostgreSQL (relational)
- **Cache/Queue**: Redis (matchmaking, sessions)
- **Storage**: S3-compatible (avatars, logs)
- **Email**: SMTP (MailDev for dev)

## Core Modules

### 1. Authentication Module

**Responsibilities:**
- User registration (email + password)
- OAuth (Google, Apple)
- JWT token generation (access + refresh)
- Token validation
- Session management

**Flow:**
```
User → Register/Login → Backend validates
     → Generate JWT pair → Store refresh token in DB
     → Return tokens to client → Client stores in SecureStore
```

**Security:**
- Passwords hashed with Argon2
- JWT with 15min access, 7day refresh
- Refresh token rotation on use
- Age verification (18+)
- Geo restriction checks

### 2. Wallet Module

**Responsibilities:**
- Balance management
- Transaction ledger
- Fund locking/unlocking
- Deposit flow (Stripe)
- Withdrawal requests

**Transaction Types:**
- `DEPOSIT`: User adds funds
- `WITHDRAWAL`: User cashes out
- `ENTRY_FEE`: Match entry deducted
- `WINNING`: Match prize awarded
- `REFUND`: Match cancelled/tie
- `BONUS`: Promotional credits

**Stripe Integration:**
```
Mobile → Create PaymentIntent (backend)
      → Backend returns clientSecret
      → Mobile presents Stripe sheet
      → User completes payment
      → Stripe webhook → Backend updates wallet
```

### 3. Match Module

**Responsibilities:**
- Match creation
- Game state management
- Move validation
- Win/loss determination
- Payout processing

**Match Lifecycle:**
```
1. CREATING     → Match object created
2. READY_CHECK  → Both players confirm
3. IN_PROGRESS  → Game running
4. FINISHED     → Winner determined, payouts
5. CANCELLED    → Timeout/error
6. DISPUTED     → Under review
```

**Fair Play:**
- Both players get same seed
- Server generates deck hash (audit)
- Move validation on server
- Rate limiting (10 moves/sec)
- Disconnect grace period (30s)

### 4. Matchmaking Service

**Responsibilities:**
- Queue management (Redis)
- Match pairing
- Fair matching (skill/tier)
- Queue position tracking

**Algorithm:**
```
1. Player joins queue for tier X
2. Server checks queue every 2s
3. If 2+ players in queue:
   → Create match
   → Lock funds
   → Notify both players
   → Remove from queue
4. Players ready-check (30s timeout)
5. Match starts
```

### 5. WebSocket Gateway

**Responsibilities:**
- Real-time communication
- Match events
- Reconnection handling
- State synchronization

**Events:**
- Queue updates
- Match found
- Match start countdown
- Move acknowledgments
- Match end

**Reconnection:**
```
1. Client disconnects
2. Server keeps match state for 30s
3. Client reconnects → AUTH + RESUME
4. Server sends STATE_SYNC
5. Game continues
```

### 6. Solitaire Engine

**Pure Logic (no UI):**
- Card representation
- Deck shuffling (seeded)
- Move validation
- Win condition
- Score calculation

**Determinism:**
```typescript
const seed = "match-123-abc";
const deck1 = shuffleDeck(createDeck(), seed);
const deck2 = shuffleDeck(createDeck(), seed);
// deck1 === deck2 (guaranteed)
```

## Data Flow

### Match Flow (End-to-End)

```
1. User clicks "Join $5 Match"
   ↓
2. Mobile → WS: QUEUE_JOIN {tier: TIER_5}
   ↓
3. Backend checks balance → Lock $5
   ↓
4. Add to Redis queue: queue:TIER_5
   ↓
5. Matchmaking loop finds 2 players
   ↓
6. Backend creates Match in DB
   ↓
7. WS → Both clients: MATCH_FOUND
   ↓
8. Clients → WS: MATCH_READY
   ↓
9. Backend → DB: Update match status
   ↓
10. WS → Clients: MATCH_START {seed}
    ↓
11. Both clients init game with seed
    ↓
12. Clients send moves → WS: MOVE
    ↓
13. Backend validates & stores moves
    ↓
14. First to complete → WS: MATCH_END
    ↓
15. Backend:
    - Deduct entry fees
    - Award prize to winner
    - Update XP/stats
    - Unlock funds
    ↓
16. Clients show results
```

## Database Schema

### Core Tables

**users** → User accounts
**user_profiles** → Extended profile (XP, level, stats)
**refresh_tokens** → JWT refresh tokens

**wallets** → User balances
**transactions** → Transaction ledger
**withdrawal_requests** → Pending withdrawals

**matches** → Match records
**match_players** → Player participation
**match_moves** → Move history

**disputes** → Player reports
**audit_logs** → Admin actions
**config_flags** → Feature flags
**restricted_regions** → Geo blocks

### Relationships

```
users 1───1 user_profiles
users 1───1 wallets
users 1───N transactions
users 1───N match_players
matches 1───N match_players
matches 1───N match_moves
```

## State Management (Mobile)

### Zustand Stores

**AuthStore:**
- `user`: Current user object
- `accessToken`, `refreshToken`
- `isAuthenticated`
- `setAuth()`, `clearAuth()`, `loadAuth()`

**ThemeStore:**
- `theme`: Current theme object
- `isDark`: Boolean
- `toggleTheme()`

**Future:**
- MatchStore (active match state)
- WalletStore (balance, transactions)

## Security Architecture

### Authentication Flow

```
1. Login → Backend generates:
   - Access token (JWT, 15min)
   - Refresh token (random, 7days)

2. Access token stored in memory
3. Refresh token in SecureStore (encrypted)

4. API request → Attach Bearer token
5. If 401 → Use refresh token
6. Get new tokens → Retry request
```

### Authorization Levels

- **Public**: Onboarding, login, register
- **Authenticated**: All gameplay, wallet
- **Admin**: Withdrawal approval, stats

### Input Validation

**Backend:**
```typescript
// Zod schemas in DTOs
RegisterDto.parse(body); // Throws if invalid

// NestJS validators
@IsEmail()
@MinLength(8)
```

**Mobile:**
```typescript
// Form validation
if (!email.includes('@')) {
  setError('Invalid email');
}
```

## Performance Optimizations

### Backend

- **Connection Pooling**: Prisma connection pool
- **Query Optimization**: Indexes on frequent queries
- **Caching**: Redis for queues, sessions
- **Rate Limiting**: Throttle guards

### Mobile

- **Lazy Loading**: Screens loaded on demand
- **Memoization**: React.memo, useMemo
- **Image Optimization**: Cached images
- **Network**: Request batching, retries

## Scalability

### Horizontal Scaling

**API:**
- Stateless design
- Session data in Redis
- Load balancer distributes traffic

**WebSocket:**
- Socket.io adapter (Redis)
- Clients reconnect to any server

**Database:**
- Read replicas for queries
- Write to primary
- Connection pooling

### Vertical Scaling

- Increase server resources
- Database tuning (indexes, vacuuming)
- Redis memory limits

## Monitoring & Observability

### Metrics to Track

**Backend:**
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (5xx errors)
- Database query time
- WebSocket connections

**Business:**
- Active users
- Matches per hour
- Deposit/withdrawal volume
- Platform revenue

### Logging

- **Structured logs** (JSON)
- **Log levels**: error, warn, info, debug
- **Context**: userId, matchId, requestId

### Alerts

- API downtime
- High error rate
- Database connection issues
- Payment failures

## Future: Game Hub Architecture

### Multi-Game Design

```
Game Hub
├── Solitaire
├── Chess
├── Poker
└── Puzzle

Shared:
├── Authentication
├── Wallet
├── Leaderboards
└── Social
```

**Game Adapter Interface:**
```typescript
interface GameAdapter {
  initializeGame(seed: string): GameState;
  validateMove(state: GameState, move: Move): boolean;
  applyMove(state: GameState, move: Move): GameState;
  checkWin(state: GameState): boolean;
  getScore(state: GameState): number;
}
```

---

**Last Updated**: 2026-01-07
**Version**: 1.0.0
