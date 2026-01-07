import { z } from 'zod';
import { MatchTier } from '../types/match.types';

export const JoinQueueDto = z.object({
  tier: z.nativeEnum(MatchTier),
});

export type JoinQueueDto = z.infer<typeof JoinQueueDto>;

export interface MatchLobbyTier {
  tier: MatchTier;
  entryFeeCents: number;
  prizePoolCents: number;
  platformFeeCents: number;
  winnerPayout: number;
  isPractice: boolean;
}

export interface MatchMetadata {
  id: string;
  tier: MatchTier;
  status: string;
  players: Array<{
    userId: string;
    nickname: string;
    avatarUrl: string | null;
    isWinner: boolean;
    finalScore: number | null;
    finalTimeMs: number | null;
  }>;
  startedAt: string | null;
  finishedAt: string | null;
  myPayoutCents: number;
}

export interface MatchHistoryItem {
  matchId: string;
  tier: MatchTier;
  entryFeeCents: number;
  isWinner: boolean;
  payoutCents: number;
  finalScore: number;
  finalTimeMs: number;
  opponent: {
    nickname: string;
    avatarUrl: string | null;
  };
  playedAt: string;
}
