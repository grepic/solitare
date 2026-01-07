export enum MatchStatus {
  CREATING = 'CREATING',
  READY_CHECK = 'READY_CHECK',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

export enum MatchTier {
  PRACTICE = 'PRACTICE',
  TIER_1 = 'TIER_1',    // $1
  TIER_5 = 'TIER_5',    // $5
  TIER_10 = 'TIER_10',  // $10
  TIER_25 = 'TIER_25',  // $25
}

export interface Match {
  id: string;
  tier: MatchTier;
  entryFeeCents: number;
  prizePoolCents: number;
  platformFeeCents: number;
  status: MatchStatus;
  seed: string;
  deckHash: string;
  startedAt: Date | null;
  finishedAt: Date | null;
  winnerId: string | null;
  createdAt: Date;
}

export interface MatchPlayer {
  matchId: string;
  userId: string;
  position: number;
  readyAt: Date | null;
  disconnectsCount: number;
  lastSeq: number;
  finalTimeMs: number | null;
  finalScore: number | null;
  isWinner: boolean;
  payoutCents: number;
}

export enum MoveType {
  DRAW = 'DRAW',
  FLIP_TABLEAU = 'FLIP_TABLEAU',
  MOVE_TO_FOUNDATION = 'MOVE_TO_FOUNDATION',
  MOVE_TO_TABLEAU = 'MOVE_TO_TABLEAU',
  WASTE_TO_TABLEAU = 'WASTE_TO_TABLEAU',
  WASTE_TO_FOUNDATION = 'WASTE_TO_FOUNDATION',
  TABLEAU_TO_FOUNDATION = 'TABLEAU_TO_FOUNDATION',
  TABLEAU_TO_TABLEAU = 'TABLEAU_TO_TABLEAU',
  FOUNDATION_TO_TABLEAU = 'FOUNDATION_TO_TABLEAU',
}

export interface MatchMove {
  matchId: string;
  userId: string;
  seq: number;
  moveType: MoveType;
  payload: Record<string, any>;
  createdAt: Date;
}

export interface OpponentInfo {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  level: number;
  winRate: number;
}
