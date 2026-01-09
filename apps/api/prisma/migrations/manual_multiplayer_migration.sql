-- Multi-Player Game System Migration
-- This adds Game, GamePlayer, Coupon, and CouponClaim tables

-- Create GameStatus enum
CREATE TYPE "GameStatus" AS ENUM ('WAITING', 'READY_CHECK', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- Create Game table (Multi-player lobbies)
CREATE TABLE "Game" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create GamePlayer table
CREATE TABLE "GamePlayer" (
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
    CONSTRAINT "GamePlayer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "GamePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create Coupon table (Welcome bonuses)
CREATE TABLE "Coupon" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create CouponClaim table
CREATE TABLE "CouponClaim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "CouponClaim_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CouponClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CouponClaim_couponId_userId_key" UNIQUE ("couponId", "userId")
);

-- Create indexes for Game table
CREATE INDEX "Game_status_createdAt_idx" ON "Game"("status", "createdAt" DESC);
CREATE INDEX "Game_tier_status_idx" ON "Game"("tier", "status");
CREATE INDEX "Game_isLimited_endsAt_idx" ON "Game"("isLimited", "endsAt");

-- Create indexes for GamePlayer table
CREATE INDEX "GamePlayer_userId_joinedAt_idx" ON "GamePlayer"("userId", "joinedAt" DESC);
CREATE INDEX "GamePlayer_gameId_isFinished_idx" ON "GamePlayer"("gameId", "isFinished");

-- Create indexes for Coupon table
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");
CREATE INDEX "Coupon_isActive_validFrom_validUntil_idx" ON "Coupon"("isActive", "validFrom", "validUntil");

-- Create indexes for CouponClaim table
CREATE INDEX "CouponClaim_userId_claimedAt_idx" ON "CouponClaim"("userId", "claimedAt" DESC);
