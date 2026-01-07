# Solitaire Smash - Skill-Based Mobile Gaming Platform

A production-ready, skill-based Solitaire competition platform with real-money matches, featuring:
- **Mobile App** (iOS + Android) built with React Native + Expo
- **Backend API** with NestJS, PostgreSQL, Redis, and WebSocket
- **Real-time 1v1 Matchmaking** with fair play guarantees
- **Stripe Integration** for deposits and withdrawals
- **Modular Architecture** ready for Game Hub integration

## 🏗️ Architecture

This is a **monorepo** managed with Yarn Workspaces:

```
solitare/
├── apps/
│   ├── mobile/          # React Native + Expo mobile app
│   └── api/             # NestJS backend API
├── packages/
│   ├── shared/          # Shared types, DTOs, constants
│   ├── ui-kit/          # Design system for mobile
│   ├── solitaire-engine/# Core game logic (pure TypeScript)
│   └── games/
│       └── solitaire/   # Solitaire game adapter
└── docker-compose.yml   # Local development environment
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18.0.0
- **Yarn** >= 1.22.0
- **Docker** & **Docker Compose** (for local development)
- **PostgreSQL** 16+
- **Redis** 7+

### 1. Clone and Install

```bash
git clone <repository-url>
cd solitare
yarn install
```

### 2. Start Infrastructure

```bash
# Start PostgreSQL, Redis, MailDev
docker-compose up -d

# Verify services are running
docker ps
```

### 3. Configure Environment

```bash
cd apps/api
cp .env.example .env

# Edit .env with your configuration:
# - JWT_SECRET (generate a strong secret)
# - STRIPE_SECRET_KEY (from Stripe dashboard)
# - STRIPE_WEBHOOK_SECRET (from Stripe CLI or dashboard)
```

### 4. Setup Database

```bash
# Generate Prisma Client
cd apps/api
yarn db:generate

# Run migrations
yarn db:migrate

# (Optional) Seed data
yarn db:seed
```

### 5. Start Development Servers

```bash
# Terminal 1: API Server
yarn dev:api

# Terminal 2: Mobile App
yarn dev:mobile
```

**API** runs on `http://localhost:3000`
**Mobile** runs on Expo (scan QR code with Expo Go app)

## 📱 Mobile App

### Running on Device/Simulator

```bash
cd apps/mobile

# iOS Simulator
yarn ios

# Android Emulator
yarn android

# Expo Go
yarn start
```

### Building for Production

```bash
# iOS
eas build --platform ios --profile production

# Android
eas build --platform android --profile production
```

## 🔧 API Documentation

### REST Endpoints

**Auth**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

**User**
- `GET /api/me` - Get current user profile
- `PATCH /api/me/profile` - Update profile
- `GET /api/me/matches` - Match history

**Wallet**
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - Transaction history
- `POST /api/wallet/deposit-intent` - Create Stripe PaymentIntent
- `POST /api/wallet/withdraw-request` - Request withdrawal

**Match**
- `GET /api/match/lobby/tiers` - Get available match tiers
- `GET /api/match/:id` - Get match details
- `GET /api/match/:id/state` - Get match state (for reconnect)

**Admin**
- `GET /api/admin/withdrawals` - List withdrawal requests
- `POST /api/admin/withdrawals/:id/approve` - Approve withdrawal
- `POST /api/admin/withdrawals/:id/reject` - Reject withdrawal
- `GET /api/admin/stats` - Platform statistics

### WebSocket Events

**Client → Server**
- `AUTH` - Authenticate WebSocket connection
- `QUEUE_JOIN` - Join matchmaking queue
- `QUEUE_CANCEL` - Cancel queue
- `MATCH_READY` - Confirm ready for match
- `MOVE` - Send game move
- `RESIGN` - Resign from match
- `PING` - Ping server

**Server → Client**
- `QUEUE_STATUS` - Queue position update
- `MATCH_FOUND` - Match found
- `MATCH_START` - Match starting countdown
- `STATE_SYNC` - Sync game state (reconnect)
- `MOVE_ACK` - Move acknowledged
- `MATCH_END` - Match finished
- `ERROR` - Error message
- `PONG` - Pong response

## 🎮 Game Rules

### Klondike Solitaire

- Standard 52-card deck
- 7 tableau piles (1, 2, 3, 4, 5, 6, 7 cards)
- 4 foundation piles (build up by suit from Ace to King)
- Stock and waste pile
- Draw 1 card at a time

### Match Rules

1. Both players receive **identical deck** (same seed)
2. First to complete wins
3. If both complete: fastest time wins
4. Tie-breaker: highest score
5. Maximum match duration: 10 minutes
6. Disconnect grace period: 30 seconds

### Scoring

- Move to foundation: +10 points
- Flip tableau card: +5 points
- Move from foundation: -15 points (penalty)
- Complete game: +100 XP (winner), +25 XP (loser)

## 💰 Wallet & Payments

### Stripe Integration

The platform uses Stripe for:
- **Deposits**: PaymentIntent flow (client-side)
- **Withdrawals**: Manual approval + payout
- **Webhooks**: `payment_intent.succeeded`, `payment_intent.payment_failed`

### Match Tiers

| Tier     | Entry Fee | Prize Pool | Platform Fee | Winner Gets |
|----------|-----------|------------|--------------|-------------|
| Practice | $0.00     | $0.00      | $0.00        | $0.00       |
| Tier 1   | $1.00     | $1.80      | $0.20        | $1.80       |
| Tier 5   | $5.00     | $9.00      | $1.00        | $9.00       |
| Tier 10  | $10.00    | $18.00     | $2.00        | $18.00      |
| Tier 25  | $25.00    | $45.00     | $5.00        | $45.00      |

**Platform Fee**: 10% of entry fees

## 🔒 Security & Compliance

### Legal Requirements

✅ **Age Verification**: 18+ required (checked at registration)
✅ **Geo Restrictions**: Configurable by country/state
✅ **Skill-Based**: Not gambling (identical conditions for both players)
✅ **Practice Mode**: Free mode available
✅ **Audit Logs**: All admin actions logged
✅ **Fair Play**: Seeded RNG, server-authoritative validation

### Security Features

- **Authentication**: JWT (access + refresh tokens)
- **Password Hashing**: Argon2 (memory-hard)
- **Rate Limiting**: Throttle guards on API
- **Input Validation**: Zod schemas + class-validator
- **CORS**: Configured for production origins
- **Secrets**: Environment variables (never committed)
- **Database**: Parameterized queries (Prisma)
- **WebSocket Auth**: Token-based authentication

### Anti-Cheat Measures

- Server-authoritative game state
- Move validation on backend
- Rate limiting on moves (10 moves/second max)
- Impossible move detection
- Audit trail for disputes
- Deck hash verification

## 🧪 Testing

### Backend Tests

```bash
cd apps/api
yarn test                # Run all tests
yarn test:watch          # Watch mode
yarn test:cov            # Coverage report
```

### Engine Tests

```bash
cd packages/solitaire-engine
yarn test
```

### Key Test Cases

- ✅ Solitaire engine: rules, moves, win conditions
- ✅ Deck shuffle: deterministic with seed
- ✅ Auth: registration, login, JWT refresh
- ✅ Wallet: transactions, balance locking
- ✅ Match: state machine, payouts

## 📦 Deployment

### Production Checklist

#### Backend

- [ ] Set production `DATABASE_URL`
- [ ] Set production `REDIS_HOST`
- [ ] Generate strong `JWT_SECRET`
- [ ] Configure Stripe live keys
- [ ] Set up Stripe webhooks (production endpoint)
- [ ] Configure CORS for production domain
- [ ] Enable SSL/TLS
- [ ] Set `NODE_ENV=production`
- [ ] Run database migrations: `yarn db:migrate:deploy`
- [ ] Set up monitoring (Sentry, DataDog, etc.)
- [ ] Configure backup strategy
- [ ] Set up CDN for static assets

#### Mobile

- [ ] Update `app.json` with production config
- [ ] Configure deep linking
- [ ] Set up push notifications (APNs, FCM)
- [ ] Build production bundles
- [ ] Submit to App Store / Play Store
- [ ] Configure app signing

#### Infrastructure

- [ ] PostgreSQL: managed instance (AWS RDS, Digital Ocean, etc.)
- [ ] Redis: managed instance (AWS ElastiCache, Redis Cloud)
- [ ] API: containerized deployment (Docker)
- [ ] Load balancer: nginx or cloud LB
- [ ] SSL certificates: Let's Encrypt or cloud provider
- [ ] Backups: automated daily backups
- [ ] Monitoring: uptime, errors, performance

### Environment Variables (Production)

```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379

# JWT
JWT_SECRET=<generate-strong-secret-256-bits>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_live_...

# OAuth (if enabled)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# App
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://yourdomain.com

# Security
ARGON2_MEMORY_COST=65536
ARGON2_TIME_COST=3
ARGON2_PARALLELISM=4
```

## 🎯 Roadmap

### Current (MVP)

- [x] Authentication (Email + OAuth)
- [x] Wallet (Stripe deposits/withdrawals)
- [x] 1v1 Matchmaking
- [x] Klondike Solitaire game
- [x] Real-time WebSocket gameplay
- [x] Admin panel (withdrawal approval)
- [x] Mobile app (iOS + Android)

### Next Steps

- [ ] Push notifications
- [ ] Tournaments
- [ ] Leaderboards
- [ ] Friend system
- [ ] Chat/Messaging
- [ ] Multiple game modes (Spider, FreeCell)
- [ ] Practice replays
- [ ] Achievement system
- [ ] Referral program

### Future (Game Hub)

- [ ] Multi-game platform architecture
- [ ] Shared wallet across games
- [ ] Cross-game leaderboards
- [ ] Universal profile/stats

## 🛠️ Development

### Code Style

```bash
# Lint
yarn lint

# Format
yarn format

# Type check
yarn typecheck
```

### Database

```bash
# Prisma Studio (GUI)
yarn db:studio

# Create migration
cd apps/api
yarn prisma migrate dev --name your_migration_name

# Generate types
yarn db:generate
```

### Adding a New Game

1. Create game engine in `packages/games/your-game/`
2. Implement `GameAdapter` interface
3. Add game routes to API
4. Create mobile screens
5. Update shared types
6. Add to lobby UI

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is proprietary. All rights reserved.

## 🆘 Support

For issues, questions, or feature requests:
- Create an issue on GitHub
- Contact: support@solitaire-smash.com

---

**Built with ❤️ for skill-based mobile gaming**
