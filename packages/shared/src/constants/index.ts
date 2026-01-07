import { MatchTier } from '../types/match.types';

export const MATCH_TIER_CONFIG: Record<
  MatchTier,
  {
    entryFeeCents: number;
    prizePoolCents: number;
    platformFeeCents: number;
    isPractice: boolean;
  }
> = {
  [MatchTier.PRACTICE]: {
    entryFeeCents: 0,
    prizePoolCents: 0,
    platformFeeCents: 0,
    isPractice: true,
  },
  [MatchTier.TIER_1]: {
    entryFeeCents: 100, // $1.00
    prizePoolCents: 180, // $1.80
    platformFeeCents: 20, // $0.20 (10%)
    isPractice: false,
  },
  [MatchTier.TIER_5]: {
    entryFeeCents: 500, // $5.00
    prizePoolCents: 900, // $9.00
    platformFeeCents: 100, // $1.00 (10%)
    isPractice: false,
  },
  [MatchTier.TIER_10]: {
    entryFeeCents: 1000, // $10.00
    prizePoolCents: 1800, // $18.00
    platformFeeCents: 200, // $2.00 (10%)
    isPractice: false,
  },
  [MatchTier.TIER_25]: {
    entryFeeCents: 2500, // $25.00
    prizePoolCents: 4500, // $45.00
    platformFeeCents: 500, // $5.00 (10%)
    isPractice: false,
  },
};

export const WALLET_LIMITS = {
  MIN_DEPOSIT_CENTS: 100, // $1
  MAX_DEPOSIT_CENTS: 100000, // $1000
  MIN_WITHDRAWAL_CENTS: 500, // $5
  MAX_WITHDRAWAL_CENTS: 1000000, // $10000
};

export const MATCH_CONSTANTS = {
  READY_CHECK_TIMEOUT_MS: 30000, // 30 seconds
  RECONNECT_GRACE_PERIOD_MS: 30000, // 30 seconds
  MAX_MATCH_DURATION_MS: 600000, // 10 minutes
  MOVE_RATE_LIMIT_PER_SECOND: 10,
};

export const JWT_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
};

export const AGE_LIMIT = 18;

export const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  UNDERAGE: 'UNDERAGE',
  GEO_RESTRICTED: 'GEO_RESTRICTED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Wallet
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  WITHDRAWAL_LIMIT_EXCEEDED: 'WITHDRAWAL_LIMIT_EXCEEDED',
  DEPOSIT_FAILED: 'DEPOSIT_FAILED',

  // Match
  ALREADY_IN_QUEUE: 'ALREADY_IN_QUEUE',
  MATCH_NOT_FOUND: 'MATCH_NOT_FOUND',
  INVALID_MOVE: 'INVALID_MOVE',
  MATCH_ALREADY_FINISHED: 'MATCH_ALREADY_FINISHED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // General
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
} as const;
