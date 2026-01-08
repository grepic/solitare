# Setup Guide - Solitaire Mobile App

This guide will help you set up and run the complete Solitaire mobile application stack.

## Prerequisites

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** 16+
- **Redis** 7+
- **Docker** (optional, for easy database setup)
- **Expo CLI** for mobile development
- **iOS Simulator** (macOS) or **Android Studio** (for Android development)

## Quick Start with Docker

The fastest way to get started is using Docker Compose:

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# This starts:
# - PostgreSQL on port 5432
# - Redis on port 6379
```

## Backend Setup (NestJS API)

### 1. Install Dependencies

```bash
cd apps/api
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Database - Update if using custom credentials
DATABASE_URL="postgresql://solitaire:solitaire_dev_password@localhost:5432/solitaire_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT - CHANGE THESE IN PRODUCTION!
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Stripe - Get from https://dashboard.stripe.com/test/apikeys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key

# OAuth - Get credentials from provider dashboards
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_TEAM_ID=your-apple-team-id
APPLE_KEY_ID=your-apple-key-id
APPLE_PRIVATE_KEY_PATH=./secrets/AuthKey_XXX.p8

# App Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:19006

# Platform Settings
PLATFORM_FEE_PERCENTAGE=10
```

### 3. Run Database Migrations

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations to create database schema
npx prisma migrate dev --name initial_setup

# (Optional) Seed database with test data
npm run seed
```

### 4. Start the API Server

```bash
# Development mode with hot reload
npm run start:dev

# The API will be available at http://localhost:3000
```

### 5. Verify API is Running

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

## Mobile App Setup (React Native + Expo)

### 1. Install Dependencies

```bash
cd apps/mobile
npm install
```

### 2. Configure Environment

Create `src/config/env.ts` if it doesn't exist:

```typescript
const ENV = {
  API_URL: 'http://localhost:3000',
  WS_URL: 'ws://localhost:3000',
  STRIPE_PUBLISHABLE_KEY: 'pk_test_your_publishable_key',
};

export default ENV;
```

For physical devices, replace `localhost` with your computer's IP address:
```typescript
API_URL: 'http://192.168.1.100:3000',  // Use your actual IP
```

### 3. Add Sound Assets (Optional)

Sound effects are optional but enhance the user experience:

1. Download free sound files (see `apps/mobile/src/assets/README.md` for sources)
2. Place MP3 files in `apps/mobile/src/assets/sounds/`:
   - card-flip.mp3
   - card-place.mp3
   - card-shuffle.mp3
   - win.mp3
   - error.mp3
   - button.mp3

The app works without sounds - they fail gracefully.

### 4. Start Expo Development Server

```bash
# Start Expo
npm start

# Or for specific platform:
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

### 5. Run on Device/Simulator

- **iOS**: Press `i` in terminal or scan QR code with Expo Go app
- **Android**: Press `a` in terminal or scan QR code with Expo Go app
- **Web**: Press `w` in terminal

## Stripe Webhook Setup (for Payment Testing)

To test Stripe payments locally, you need to forward webhooks:

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Other platforms: https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe

```bash
stripe login
```

### 3. Forward Webhooks

```bash
stripe listen --forward-to localhost:3000/stripe/webhook

# Copy the webhook signing secret (whsec_...)
# Update STRIPE_WEBHOOK_SECRET in .env
```

### 4. Test Payments

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

## OAuth Setup (Optional)

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Secret to `.env`

### Apple Sign In

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create an App ID with Sign in with Apple capability
3. Create a Service ID
4. Download private key (.p8 file)
5. Update `.env` with Team ID, Key ID, and private key path

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps
# or
pg_isready -h localhost -p 5432

# View logs
docker logs solitaire-postgres
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping
# Should return: PONG

# View logs
docker logs solitaire-redis
```

### Mobile App Can't Connect to API

1. Check API is running: `curl http://localhost:3000/health`
2. For physical devices, use computer's IP instead of `localhost`
3. Check firewall isn't blocking port 3000
4. Verify CORS_ORIGIN in `.env` includes your Expo URL

### Expo Build Issues

```bash
# Clear cache and reinstall
rm -rf node_modules
npm install

# Clear Expo cache
expo start -c
```

## Development Workflow

### Database Changes

After modifying `prisma/schema.prisma`:

```bash
cd apps/api
npx prisma migrate dev --name describe_your_changes
npx prisma generate
```

### API Code Changes

The dev server auto-reloads on file changes. No restart needed.

### Mobile Code Changes

Expo uses Fast Refresh - changes appear instantly. Press `r` to reload manually.

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production setup instructions including:
- Environment variable configuration
- Database hosting (AWS RDS, DigitalOcean, etc.)
- API deployment (Docker, Kubernetes, Heroku)
- Mobile app builds (EAS Build)
- Stripe production setup
- Security hardening

## Testing

### Backend Tests

```bash
cd apps/api
npm test              # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage report
```

### Mobile Tests

```bash
cd apps/mobile
npm test              # Jest tests
```

## Admin Access

To create an admin user:

```bash
# Connect to database
psql postgresql://solitaire:solitaire_dev_password@localhost:5432/solitaire_db

# Update user role
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-email@example.com';
```

Admin features available at `/admin/*` endpoints (protected by JwtAuthGuard + RolesGuard).

## Need Help?

- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Check [GAMEPLAY.md](./GAMEPLAY.md) for game rules
- Review [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) for feature list
- See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines

## Next Steps

After setup:
1. Create a test account via mobile app
2. Make an admin account (see above)
3. Test matchmaking by opening app on two devices/simulators
4. Try a practice match (free)
5. Test Stripe payment flow with test card
6. View admin dashboard at API endpoints
7. Check leaderboards and achievements

Enjoy building! 🎮
