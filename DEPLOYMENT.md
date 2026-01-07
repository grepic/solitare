# Deployment Guide

## Prerequisites

- Node.js 18+
- Yarn 1.22+
- Docker (for local dev)
- PostgreSQL 16+ (production)
- Redis 7+ (production)
- Stripe account
- EAS CLI (for mobile builds)

## Local Development Setup

### 1. Install Dependencies

```bash
yarn install
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

Verify:
```bash
docker ps
# Should show: postgres, redis, maildev
```

### 3. Configure Environment

```bash
cd apps/api
cp .env.example .env
```

Edit `.env`:
```bash
DATABASE_URL="postgresql://solitaire:solitaire_dev_password@localhost:5432/solitaire_db"
REDIS_HOST=localhost
JWT_SECRET=dev-secret-change-in-production
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_secret
```

### 4. Database Setup

```bash
cd apps/api

# Generate Prisma Client
yarn prisma generate

# Run migrations
yarn prisma migrate dev

# (Optional) Open Prisma Studio
yarn prisma studio
```

### 5. Start Servers

Terminal 1 (API):
```bash
yarn dev:api
```

Terminal 2 (Mobile):
```bash
yarn dev:mobile
```

## Production Deployment

### Backend (API)

#### Option 1: Docker Deployment

**Build Image:**
```bash
cd apps/api
docker build -t solitaire-api:latest .
```

**Run Container:**
```bash
docker run -d \
  -p 3000:3000 \
  --env-file .env.production \
  solitaire-api:latest
```

#### Option 2: Traditional Deployment

**Build:**
```bash
cd apps/api
yarn build
```

**Run:**
```bash
NODE_ENV=production node dist/main.js
```

#### Environment Variables (Production)

```bash
# Database
DATABASE_URL=postgresql://user:password@production-host:5432/dbname

# Redis
REDIS_HOST=production-redis-host
REDIS_PORT=6379

# JWT
JWT_SECRET=<256-bit-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com
```

#### Database Migration (Production)

```bash
cd apps/api
yarn prisma migrate deploy
```

⚠️ **Important**: Never run `migrate dev` in production!

### Mobile App

#### Prerequisites

```bash
npm install -g eas-cli
eas login
```

#### Configure EAS

```bash
cd apps/mobile
eas build:configure
```

#### Build for iOS

```bash
# Development build
eas build --platform ios --profile development

# Production build
eas build --platform ios --profile production
```

#### Build for Android

```bash
# Development build
eas build --platform android --profile development

# Production build
eas build --platform android --profile production
```

#### Submit to Stores

**iOS (App Store):**
```bash
eas submit --platform ios
```

**Android (Play Store):**
```bash
eas submit --platform android
```

## Infrastructure Setup

### PostgreSQL (Managed)

**Recommended Providers:**
- AWS RDS
- Digital Ocean Managed Databases
- Supabase
- Neon

**Configuration:**
```sql
-- Create database
CREATE DATABASE solitaire_db;

-- Create user
CREATE USER solitaire WITH PASSWORD 'secure-password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE solitaire_db TO solitaire;
```

**Connection String:**
```
postgresql://solitaire:password@host:5432/solitaire_db?sslmode=require
```

### Redis (Managed)

**Recommended Providers:**
- AWS ElastiCache
- Redis Cloud
- Digital Ocean Managed Redis

**Configuration:**
- Enable persistence (AOF)
- Set maxmemory-policy: allkeys-lru
- Enable SSL/TLS

### Stripe Setup

1. **Create Stripe Account**: https://stripe.com
2. **Get API Keys**: Dashboard → Developers → API Keys
3. **Set Up Webhooks**:
   - Endpoint: `https://your-api.com/api/webhooks/stripe`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Get webhook secret

### Load Balancer (nginx)

**nginx.conf:**
```nginx
upstream api {
    server 127.0.0.1:3000;
    # Add more servers for load balancing
}

server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/api.your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.your-domain.com/privkey.pem;

    location / {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### SSL Certificates

**Let's Encrypt (Free):**
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

## Monitoring

### Application Monitoring

**Recommended Tools:**
- Sentry (error tracking)
- DataDog (APM)
- New Relic (performance)

**Setup Sentry:**
```bash
yarn add @sentry/node

# In main.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

### Database Monitoring

- Enable slow query log
- Monitor connection pool
- Track query performance
- Set up alerts for high CPU/memory

### Infrastructure Monitoring

**Metrics to Track:**
- CPU usage
- Memory usage
- Disk I/O
- Network traffic
- Request rate
- Error rate

**Tools:**
- Grafana + Prometheus
- CloudWatch (AWS)
- DataDog

## Backup Strategy

### Database Backups

**Automated Daily Backups:**
```bash
#!/bin/bash
# backup-db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.sql"

pg_dump $DATABASE_URL > $BACKUP_FILE
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://your-backup-bucket/
```

**Schedule with cron:**
```bash
0 2 * * * /path/to/backup-db.sh
```

### Redis Backups

Enable AOF (Append-Only File):
```bash
redis-cli CONFIG SET appendonly yes
redis-cli CONFIG SET appendfsync everysec
```

## Rollback Procedure

### Database Rollback

```bash
# List migrations
yarn prisma migrate status

# Rollback one migration
yarn prisma migrate resolve --rolled-back <migration-name>

# Restore from backup
psql $DATABASE_URL < backup.sql
```

### Application Rollback

**Docker:**
```bash
# Revert to previous image
docker pull solitaire-api:v1.0.0
docker stop current-container
docker run -d solitaire-api:v1.0.0
```

**Traditional:**
```bash
git checkout v1.0.0
yarn install
yarn build
pm2 restart api
```

## Scaling

### Horizontal Scaling (Multiple API Servers)

1. **Deploy multiple API instances**
2. **Configure Redis adapter for Socket.io:**

```typescript
// In websocket module
import { RedisIoAdapter } from './redis-io.adapter';

app.useWebSocketAdapter(new RedisIoAdapter(app));
```

3. **Set up load balancer** (nginx, AWS ALB)

### Vertical Scaling

- Increase server CPU/RAM
- Tune PostgreSQL (shared_buffers, max_connections)
- Increase Redis memory limit

## Health Checks

**API Health Endpoint:**
```typescript
// health.controller.ts
@Get('health')
async health() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

**Docker Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

## Troubleshooting

### API Not Starting

```bash
# Check logs
docker logs api-container

# Check database connection
psql $DATABASE_URL

# Check Redis connection
redis-cli -h $REDIS_HOST ping
```

### Database Migration Failed

```bash
# Check migration status
yarn prisma migrate status

# Resolve manually
yarn prisma migrate resolve --applied <migration-name>
```

### WebSocket Connections Failing

- Check CORS configuration
- Verify WebSocket route in nginx
- Check SSL certificate

### Stripe Webhooks Not Working

- Verify webhook secret
- Check endpoint URL
- Test with Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`

## Security Checklist

- [ ] SSL/TLS enabled
- [ ] Strong JWT secret (256-bit)
- [ ] Database encrypted at rest
- [ ] Redis password protected
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Secrets in environment variables (not committed)
- [ ] Admin panel restricted
- [ ] Audit logging enabled
- [ ] Regular security updates

---

**Last Updated**: 2026-01-07
