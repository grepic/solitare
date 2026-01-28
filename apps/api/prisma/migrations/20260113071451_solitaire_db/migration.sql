-- CreateEnum
CREATE TYPE "OAuthProvider" AS ENUM ('APPLE', 'GOOGLE', 'EMAIL');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('DEPOSIT', 'WITHDRAWAL', 'ENTRY_FEE', 'WINNING', 'REFUND', 'BONUS');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('CREATING', 'READY_CHECK', 'IN_PROGRESS', 'FINISHED', 'CANCELLED', 'DISPUTED');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('WAITING', 'READY_CHECK', 'IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MatchTier" AS ENUM ('PRACTICE', 'TIER_1', 'TIER_5', 'TIER_10', 'TIER_25');

-- CreateEnum
CREATE TYPE "AgeVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "oauthProvider" "OAuthProvider" NOT NULL,
    "oauthId" TEXT,
    "nickname" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserProfile" (
    "userId" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "userId" TEXT NOT NULL,
    "balanceCents" INTEGER NOT NULL DEFAULT 0,
    "lockedCents" INTEGER NOT NULL DEFAULT 0,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TransactionType" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "status" "TransactionStatus" NOT NULL,
    "providerRef" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "payoutMethod" TEXT NOT NULL,
    "payoutDetails" JSONB NOT NULL,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "tier" "MatchTier" NOT NULL,
    "entryFeeCents" INTEGER NOT NULL,
    "prizePoolCents" INTEGER NOT NULL,
    "platformFeeCents" INTEGER NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'CREATING',
    "seed" TEXT NOT NULL,
    "deckHash" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchPlayer" (
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "readyAt" TIMESTAMP(3),
    "disconnectsCount" INTEGER NOT NULL DEFAULT 0,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,
    "finalTimeMs" INTEGER,
    "finalScore" INTEGER,
    "isWinner" BOOLEAN NOT NULL DEFAULT false,
    "payoutCents" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "MatchPlayer_pkey" PRIMARY KEY ("matchId","userId")
);

-- CreateTable
CREATE TABLE "MatchMove" (
    "matchId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "moveType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchMove_pkey" PRIMARY KEY ("matchId","userId","seq")
);

-- CreateTable
CREATE TABLE "Dispute" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "evidence" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dispute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigFlag" (
    "key" TEXT NOT NULL,
    "valueJson" JSONB NOT NULL,
    "description" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigFlag_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RestrictedRegion" (
    "id" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL,
    "stateCode" TEXT,
    "reason" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RestrictedRegion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgeVerificationRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "frontImageUrl" TEXT NOT NULL,
    "backImageUrl" TEXT,
    "status" "TransactionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgeVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "targetScore" INTEGER NOT NULL,
    "targetTime" INTEGER NOT NULL,
    "rewardCents" INTEGER NOT NULL,
    "participants" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeCompletion" (
    "userId" TEXT NOT NULL,
    "challengeId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "timeMs" INTEGER NOT NULL,
    "rewardClaimed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DailyChallengeCompletion_pkey" PRIMARY KEY ("userId","challengeId")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "iconUrl" TEXT,
    "xpReward" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "userId" TEXT NOT NULL,
    "achievementId" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("userId","achievementId")
);

-- CreateTable
CREATE TABLE "RateLimitEntry" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

    CONSTRAINT "GamePlayer_pkey" PRIMARY KEY ("gameId","userId")
);

-- CreateTable
CREATE TABLE "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CouponClaim" (
    "id" TEXT NOT NULL,
    "couponId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "CouponClaim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_oauthProvider_oauthId_idx" ON "User"("oauthProvider", "oauthId");

-- CreateIndex
CREATE INDEX "UserProfile_country_idx" ON "UserProfile"("country");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_token_key" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_token_idx" ON "RefreshToken"("token");

-- CreateIndex
CREATE INDEX "Transaction_userId_createdAt_idx" ON "Transaction"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");

-- CreateIndex
CREATE INDEX "Transaction_providerRef_idx" ON "Transaction"("providerRef");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_userId_idx" ON "WithdrawalRequest"("userId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");

-- CreateIndex
CREATE INDEX "Match_status_createdAt_idx" ON "Match"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Match_winnerId_idx" ON "Match"("winnerId");

-- CreateIndex
CREATE INDEX "MatchPlayer_userId_idx" ON "MatchPlayer"("userId");

-- CreateIndex
CREATE INDEX "MatchMove_matchId_seq_idx" ON "MatchMove"("matchId", "seq");

-- CreateIndex
CREATE INDEX "Dispute_matchId_idx" ON "Dispute"("matchId");

-- CreateIndex
CREATE INDEX "Dispute_status_idx" ON "Dispute"("status");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "RestrictedRegion_isActive_idx" ON "RestrictedRegion"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RestrictedRegion_countryCode_stateCode_key" ON "RestrictedRegion"("countryCode", "stateCode");

-- CreateIndex
CREATE INDEX "AgeVerificationRequest_userId_status_idx" ON "AgeVerificationRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "AgeVerificationRequest_status_createdAt_idx" ON "AgeVerificationRequest"("status", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_date_key" ON "DailyChallenge"("date");

-- CreateIndex
CREATE INDEX "DailyChallenge_date_idx" ON "DailyChallenge"("date" DESC);

-- CreateIndex
CREATE INDEX "DailyChallengeCompletion_userId_completedAt_idx" ON "DailyChallengeCompletion"("userId", "completedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_key_key" ON "Achievement"("key");

-- CreateIndex
CREATE INDEX "UserAchievement_userId_isCompleted_idx" ON "UserAchievement"("userId", "isCompleted");

-- CreateIndex
CREATE INDEX "RateLimitEntry_key_action_timestamp_idx" ON "RateLimitEntry"("key", "action", "timestamp");

-- CreateIndex
CREATE INDEX "RateLimitEntry_timestamp_idx" ON "RateLimitEntry"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookEvent_eventId_key" ON "StripeWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_eventId_idx" ON "StripeWebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_processedAt_idx" ON "StripeWebhookEvent"("processedAt" DESC);

-- CreateIndex
CREATE INDEX "Game_status_createdAt_idx" ON "Game"("status", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "Game_tier_status_idx" ON "Game"("tier", "status");

-- CreateIndex
CREATE INDEX "Game_isLimited_endsAt_idx" ON "Game"("isLimited", "endsAt");

-- CreateIndex
CREATE INDEX "GamePlayer_userId_joinedAt_idx" ON "GamePlayer"("userId", "joinedAt" DESC);

-- CreateIndex
CREATE INDEX "GamePlayer_gameId_isFinished_idx" ON "GamePlayer"("gameId", "isFinished");

-- CreateIndex
CREATE UNIQUE INDEX "Coupon_code_key" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_code_idx" ON "Coupon"("code");

-- CreateIndex
CREATE INDEX "Coupon_isActive_validFrom_validUntil_idx" ON "Coupon"("isActive", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "CouponClaim_userId_claimedAt_idx" ON "CouponClaim"("userId", "claimedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "CouponClaim_couponId_userId_key" ON "CouponClaim"("couponId", "userId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WithdrawalRequest" ADD CONSTRAINT "WithdrawalRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchPlayer" ADD CONSTRAINT "MatchPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchMove" ADD CONSTRAINT "MatchMove_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchMove" ADD CONSTRAINT "MatchMove_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dispute" ADD CONSTRAINT "Dispute_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgeVerificationRequest" ADD CONSTRAINT "AgeVerificationRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeCompletion" ADD CONSTRAINT "DailyChallengeCompletion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePlayer" ADD CONSTRAINT "GamePlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponClaim" ADD CONSTRAINT "CouponClaim_couponId_fkey" FOREIGN KEY ("couponId") REFERENCES "Coupon"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CouponClaim" ADD CONSTRAINT "CouponClaim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
