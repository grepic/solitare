#!/bin/bash

# Complete Database Setup Script
# This creates ALL tables from Prisma schema

echo "🗄️  Setting up complete database schema..."

PGPASSWORD='solitaire_dev_password' psql -U solitaire -d solitaire_db -h localhost <<'EOSQL'

-- Drop existing tables if needed (for clean setup)
-- DROP TABLE IF EXISTS "GamePlayer", "Game", "CouponClaim", "Coupon" CASCADE;

-- Create all enums
DO $$ BEGIN
  CREATE TYPE "OAuthProvider" AS ENUM ('APPLE', 'GOOGLE', 'EMAIL');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "Currency" AS ENUM ('USD');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'ENTRY_FEE', 'WINNING', 'REFUND', 'BONUS');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MatchStatus" AS ENUM ('CREATING', 'READY_CHECK', 'IN_PROGRESS', 'FINISHED', 'CANCELLED', 'DISPUTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "GameStatus" AS ENUM ('WAITING', 'READY_CHECK', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "MatchTier" AS ENUM ('PRACTICE', 'TIER_1', 'TIER_5', 'TIER_10', 'TIER_25');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AgeVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create User table (required for foreign keys)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT,
    "oauthProvider" "OAuthProvider" NOT NULL,
    "oauthId" TEXT,
    "nickname" TEXT NOT NULL UNIQUE,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create UserProfile table
CREATE TABLE IF NOT EXISTS "UserProfile" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "country" TEXT,
    "state" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "ageVerified" BOOLEAN NOT NULL DEFAULT false,
    "ageVerificationStatus" "AgeVerificationStatus",
    "depositLimitDaily" INTEGER,
    "depositLimitWeekly" INTEGER,
    "depositLimitMonthly" INTEGER,
    "lossLimitDaily" INTEGER,
    "lossLimitWeekly" INTEGER,
    "lossLimitMonthly" INTEGER,
    "sessionLimitMinutes" INTEGER,
    "sessionWarningMinutes" INTEGER,
    "selfExclusionActive" BOOLEAN NOT NULL DEFAULT false,
    "selfExclusionStart" TIMESTAMP(3),
    "selfExclusionEnd" TIMESTAMP(3),
    "selfExclusionReason" TEXT,
    "limitsUpdatedAt" TIMESTAMP(3),
    "xp" INTEGER NOT NULL DEFAULT 0,
    "level" INTEGER NOT NULL DEFAULT 1,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Now create Game table (already exists but let's ensure it has all fields)
CREATE TABLE IF NOT EXISTS "Game" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tier" "MatchTier" NOT NULL,
    "maxPlayers" INTEGER NOT NULL,
    "currentPlayers" INTEGER NOT NULL DEFAULT 0,
    "status" "GameStatus" NOT NULL DEFAULT 'WAITING',
    "entryFeeCents" INTEGER NOT NULL,
    "prizePoolCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "prizeDistribution" JSONB NOT NULL,
    "seed" TEXT NOT NULL,
    "deckHash" TEXT NOT NULL,
    "readyCheckStartAt" TIMESTAMP(3),
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "isLimited" BOOLEAN NOT NULL DEFAULT false,
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create GamePlayer table
CREATE TABLE IF NOT EXISTS "GamePlayer" (
    "gameId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "placement" INTEGER,
    "completionTimeMs" INTEGER,
    "finalScore" INTEGER,
    "moveCount" INTEGER NOT NULL DEFAULT 0,
    "payoutCents" INTEGER,
    "payoutPercentage" DOUBLE PRECISION,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,
    "finishedAt" TIMESTAMP(3),
    PRIMARY KEY ("gameId", "userId"),
    FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);

-- Create Coupon table
CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "valueCents" INTEGER NOT NULL,
    "isBonus" BOOLEAN NOT NULL DEFAULT true,
    "maxUses" INTEGER NOT NULL DEFAULT 1,
    "maxTotalUses" INTEGER,
    "currentUses" INTEGER NOT NULL DEFAULT 0,
    "minDepositCents" INTEGER,
    "minTierToUse" "MatchTier",
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create CouponClaim table
CREATE TABLE IF NOT EXISTS "CouponClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),
    FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE,
    UNIQUE ("couponId", "userId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "Game_status_createdAt_idx" ON "Game"("status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Game_tier_status_idx" ON "Game"("tier", "status");
CREATE INDEX IF NOT EXISTS "Game_isLimited_endsAt_idx" ON "Game"("isLimited", "endsAt");
CREATE INDEX IF NOT EXISTS "GamePlayer_userId_joinedAt_idx" ON "GamePlayer"("userId", "joinedAt" DESC);
CREATE INDEX IF NOT EXISTS "GamePlayer_gameId_isFinished_idx" ON "GamePlayer"("gameId", "isFinished");
CREATE INDEX IF NOT EXISTS "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_isActive_validFrom_validUntil_idx" ON "Coupon"("isActive", "validFrom", "validUntil");
CREATE INDEX IF NOT EXISTS "CouponClaim_userId_claimedAt_idx" ON "CouponClaim"("userId", "claimedAt" DESC);

EOSQL

echo "✅ Database schema created successfully!"
echo ""
echo "📊 Tables created:"
PGPASSWORD='solitaire_dev_password' psql -U solitaire -d solitaire_db -h localhost -c "\dt"
