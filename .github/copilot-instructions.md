# Solitaire Smash - AI Coding Instructions

## Project Overview

Real-money skill-based Solitaire platform with 1v1 multiplayer matches. **Yarn workspaces monorepo** with React Native mobile app and NestJS backend. Critical: this is real-money gaming with legal compliance requirements.

## Architecture

### Monorepo Structure
```
apps/mobile/       # React Native + Expo (iOS/Android)
apps/api/          # NestJS backend + Prisma + PostgreSQL
packages/shared/   # Types, DTOs, constants (referenced as @solitaire/shared)
packages/solitaire-engine/  # Pure TypeScript game logic (deterministic, seeded)
packages/ui-kit/   # Design system components
```

**Critical Path**: Shared types flow: `packages/shared` → imported in both `apps/api` (validation) and `apps/mobile` (UI). Changes to shared types require rebuilding both apps.

### Data Flow Pattern (Match Lifecycle)
1. Mobile → REST: Join match queue (validates wallet balance)
2. Backend → Redis: Queue player, matchmaking loop pairs users every 2s
3. Backend → WebSocket: `MATCH_FOUND` event to both players
4. Backend: Lock entry fees in wallet transactions (atomic)
5. Mobile → WebSocket: `MATCH_READY` ready-check (30s timeout)
6. Backend: Generate seed → initialize identical game states for both players
7. Mobile ↔ WebSocket: Move submission → server validates → broadcasts
8. Backend: Match end → unlock funds → award winner → audit log

**Why This Matters**: Move validation MUST happen server-side (fair play). Game state is deterministic (same seed = same deck) to enable replay/audit.

## Development Commands

```bash
# Infrastructure first (required services)
docker-compose up -d        # PostgreSQL, Redis, MailDev

# Workspaces (run from root)
yarn dev:api                # NestJS at localhost:3000
yarn dev:mobile             # Expo dev server (scan QR)
yarn db:migrate             # Prisma migrations
yarn db:studio              # Prisma Studio GUI

# Testing
yarn workspace @solitaire/solitaire-engine test  # Jest for game engine
# Note: No E2E tests yet - manual testing workflow documented in TEST_REPORT.md
```

**Database Workflow**: Prisma migrations in `apps/api/prisma/migrations/`. Manual SQL migrations exist (`manual_multiplayer_migration.sql`) for complex changes. Always generate Prisma client after schema changes: `cd apps/api && yarn db:generate`

## Code Patterns & Conventions

### Backend (NestJS)

**Module Pattern**: Every feature = dedicated module with controller/service/gateway.
```typescript
// Standard structure in apps/api/src/*/
auth/    → AuthModule, AuthService, AuthController, strategies/, guards/
wallet/  → WalletModule, WalletService, WalletController
match/   → MatchModule, MatchService, MatchmakingService, MatchController
```

**Guard Stacking** (real-money compliance):
```typescript
@UseGuards(JwtAuthGuard)  // Always first - authentication
@UseGuards(GeoRestrictionGuard, AgeVerificationGuard, ResponsibleGamingGuard)  // Compliance
@Post('join-match')
```
Guards in `apps/api/src/common/guards/`. Critical for legal requirements (18+, geo-blocking, spending limits).

**Database Access**: Use `PrismaService` (raw SQL implementation in `apps/api/src/prisma/prisma.service.ts`). Critical: transactions use raw SQL with BEGIN/COMMIT for atomic wallet operations:
```typescript
// Pattern for wallet transactions (see apps/api/src/wallet/wallet.service.ts)
await this.prisma.$transaction(async (tx) => {
  // Lock funds, deduct balance, create transaction record
});
```

**WebSocket Pattern**: Two gateways - `game.gateway.ts` (match events) and `lobby.gateway.ts` (multi-player lobbies). Auth via JWT in initial message. Reconnection grace period: 30s.

### Mobile (React Native)

**State Management**: Zustand stores in `apps/mobile/src/store/`. Critical stores:
- `auth.store.ts` - JWT tokens in SecureStore
- `game.store.ts` - Current match state
- `theme.store.ts` - Dark/light mode

**Service Layer**: Thin wrappers in `apps/mobile/src/services/`:
- `api.ts` - Axios with retry logic (exponential backoff, 3 retries)
- `websocket.ts` - Socket.io with reconnection
- `sound.service.ts` - expo-av for audio
- `haptic.service.ts` - Haptic feedback

**Navigation**: React Navigation stack. Main flow: `RootNavigator` → `AuthStack` (login/register) → `MainTabs` (home/wallet/profile) → `GameStack` (match screens).

**Game Registration**: New games register in `App.tsx` via `gameLoader.registerGame(solitaireConfig)`. Config in `apps/mobile/src/games/solitaire/index.tsx`.

### Shared Package Conventions

**Import Pattern**: `import { MatchStatus, MATCH_CONSTANTS } from '@solitaire/shared'`

**Type Definitions**: 
- Enums in Prisma schema replicated in `packages/shared/src/types/`
- DTOs use Zod schemas in `packages/shared/src/dto/`
- WebSocket events typed in `packages/shared/src/types/websocket.types.ts`

**Constants**: `packages/shared/src/constants/` - match tiers, wallet limits, timeouts. Single source of truth for both apps.

### Game Engine (Deterministic Logic)

**Critical Pattern**: Pure functions, no side effects. Seeded RNG for fairness:
```typescript
// packages/solitaire-engine/src/game.ts
const deck = shuffleDeck(createDeck(), seed);  // Same seed = identical shuffle
```

**Move Validation**: `executeMove()` returns `MoveResult` with `success` + `newState` or `error`. Backend calls this to validate player moves.

**Testing**: Jest tests in `__tests__/game.test.ts`. Test determinism: same seed produces identical games.

## Key Integration Points

### Stripe Integration
- `apps/api/src/stripe/` - Webhook handler at `/stripe/webhook` (raw body parsing)
- Mobile: `@stripe/stripe-react-native` for payment sheets
- Flow: Create PaymentIntent (backend) → Present sheet (mobile) → Webhook updates wallet

### Redis Usage
- Matchmaking queues: `queue:TIER_1`, `queue:TIER_5`, etc.
- User sessions for reconnection: `session:${userId}`
- Leaderboard caching (sorted sets)

### WebSocket Events (See packages/shared/src/types/websocket.types.ts)
```
AUTH → AUTH_SUCCESS
QUEUE_JOIN → QUEUE_STATUS
MATCH_FOUND → MATCH_READY → MATCH_START
GAME_MOVE → MOVE_VALIDATED → MATCH_END
```

## Legal Compliance Notes

**Age Verification**: Required before real-money matches. Guard checks `user.profile.ageVerified` (see `apps/api/src/common/guards/age-verification.guard.ts`).

**Geo-Restrictions**: Blocked states in `apps/api/src/common/services/geo-location.service.ts`. Real-time IP checking on match join.

**Responsible Gaming**: Daily/weekly spending limits, session time tracking. Service in `apps/api/src/users/responsible-gaming.service.ts`.

**Audit Trail**: All real-money transactions logged in `AuditLog` table with IP, user, action, metadata.

## Common Gotchas

1. **Workspace dependencies**: After editing `packages/shared`, run `yarn build` in that package, then restart both dev servers
2. **Prisma changes**: Modify `schema.prisma` → `yarn db:migrate` → `yarn db:generate` → restart API
3. **WebSocket auth**: Always emit `AUTH` event first with JWT before other messages
4. **Wallet consistency**: Never modify `Wallet.balance` directly - create `Transaction` records, balance is computed
5. **Match state sync**: WebSocket disconnects during match preserve state for 30s - implement reconnection properly
6. **Seed format**: Match seed must be `"match-${matchId}-${timestamp}"` format for audit trail

## Files to Check First

- **Adding feature**: `ARCHITECTURE.md` (module boundaries), `ADDING_NEW_GAME.md` (game integration)
- **Debugging match flow**: `apps/api/src/match/match.service.ts` + `apps/api/src/websocket/game.gateway.ts`
- **Wallet issues**: `apps/api/src/wallet/wallet.service.ts` (transaction logic)
- **Mobile UI**: `packages/ui-kit/src/components/` (design system)
- **Deployment**: `DEPLOYMENT_GUIDE.md`, `docker-compose.yml`, `setup.sh`

## Testing Approach

No automated E2E tests. Manual testing workflow:
1. Start infrastructure: `docker-compose up -d`
2. Seed test users: `yarn workspace @solitaire/api db:seed`
3. Test in parallel: Run 2 mobile instances (different accounts) for multiplayer
4. Check logs: API console + Redis CLI (`redis-cli KEYS queue:*`)

Unit tests exist for game engine only (`packages/solitaire-engine`). Use Jest, run with `yarn test`.
