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

// ============================================================================
// Multi-Player Prize Distribution (Proportional Payouts)
// ============================================================================

/**
 * Prize distribution percentages for multi-player games.
 * Key: number of players
 * Value: array of percentages (must sum to 100)
 *
 * Example for 4 players: [50, 30, 15, 5]
 * - 1st place gets 50%
 * - 2nd place gets 30%
 * - 3rd place gets 15%
 * - 4th place gets 5%
 */
export const PRIZE_DISTRIBUTION: Record<number, number[]> = {
  // 1v1 (winner takes all)
  2: [100, 0],

  // 1v2 (3 players total)
  3: [60, 30, 10],

  // 1v3 (4 players total)
  4: [50, 30, 15, 5],

  // 1v4 (5 players total)
  5: [40, 25, 20, 10, 5],

  // 1v5 (6 players total)
  6: [40, 25, 15, 10, 6, 4],

  // 1v6 (7 players total)
  7: [35, 25, 15, 10, 7, 5, 3],

  // 1v7 (8 players total)
  8: [35, 20, 15, 10, 8, 6, 4, 2],

  // 1v9 (10 players total)
  10: [30, 20, 13, 10, 8, 6, 5, 4, 3, 1],
};

/**
 * Calculates proportional payouts for a game based on player placements.
 *
 * @param prizePoolCents - Total prize pool in cents
 * @param numPlayers - Number of players in the game
 * @returns Array of payout amounts in cents for each placement (1st, 2nd, 3rd, etc.)
 */
export function calculateProportionalPayouts(
  prizePoolCents: number,
  numPlayers: number
): number[] {
  const distribution = PRIZE_DISTRIBUTION[numPlayers];

  if (!distribution) {
    throw new Error(`No prize distribution configured for ${numPlayers} players`);
  }

  return distribution.map((percentage) =>
    Math.floor((prizePoolCents * percentage) / 100)
  );
}

/**
 * Game lobby configurations (Solitaire Smash style)
 */
export const GAME_LOBBY_CONFIG = {
  // Maximum concurrent lobbies visible to players
  MAX_VISIBLE_LOBBIES: 20,

  // Lobby auto-cancel if not filled within this time
  LOBBY_TIMEOUT_MS: 300000, // 5 minutes

  // Ready check countdown (all players joined)
  READY_CHECK_DURATION_MS: 10000, // 10 seconds

  // Lobby update broadcast interval
  LOBBY_UPDATE_INTERVAL_MS: 5000, // 5 seconds

  // Minimum players to allow manual start
  MIN_PLAYERS_TO_START: 2,
};

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
