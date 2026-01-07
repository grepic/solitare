import { MatchTier, OpponentInfo } from './match.types';

// ============================================================================
// Client → Server Events
// ============================================================================

export interface ClientAuthEvent {
  accessToken: string;
}

export interface ClientQueueJoinEvent {
  tier: MatchTier;
}

export interface ClientQueueCancelEvent {}

export interface ClientMatchReadyEvent {
  matchId: string;
}

export interface ClientMoveEvent {
  matchId: string;
  seq: number;
  moveType: string;
  payload: Record<string, any>;
}

export interface ClientResignEvent {
  matchId: string;
}

export interface ClientPingEvent {
  timestamp: number;
}

export interface ClientResumeEvent {
  matchId: string;
  lastSeq: number;
}

// ============================================================================
// Server → Client Events
// ============================================================================

export interface ServerQueueStatusEvent {
  position: number;
  estimatedWaitSeconds: number | null;
}

export interface ServerMatchFoundEvent {
  matchId: string;
  opponent: OpponentInfo;
  tier: MatchTier;
  entryFeeCents: number;
  prizePoolCents: number;
  seed: string;
  rules: {
    drawCount: number;
    hintsEnabled: boolean;
    maxTimeMs: number | null;
  };
  readyCheckDeadline: number; // Unix timestamp
}

export interface ServerMatchStartEvent {
  matchId: string;
  serverTime: number;
  startAt: number; // Unix timestamp
}

export interface ServerStateSyncEvent {
  matchId: string;
  snapshot: {
    seed: string;
    moves: Array<{ seq: number; moveType: string; payload: any }>;
    currentSeq: number;
    opponentProgress?: {
      lastMoveAt: number;
      movesCount: number;
    };
  };
}

export interface ServerMoveAckEvent {
  matchId: string;
  seq: number;
  valid: boolean;
  reason?: string;
}

export interface ServerMatchEndEvent {
  matchId: string;
  winnerId: string | null;
  reason: 'COMPLETED' | 'RESIGNATION' | 'TIMEOUT' | 'DISCONNECT';
  payoutCents: number;
  stats: {
    timeMs: number;
    score: number;
    movesCount: number;
  };
  opponentStats?: {
    timeMs: number | null;
    score: number | null;
    movesCount: number;
  };
}

export interface ServerErrorEvent {
  code: string;
  message: string;
  details?: any;
}

export interface ServerPongEvent {
  timestamp: number;
  serverTime: number;
}

// ============================================================================
// WebSocket Event Map
// ============================================================================

export interface ClientToServerEvents {
  AUTH: ClientAuthEvent;
  QUEUE_JOIN: ClientQueueJoinEvent;
  QUEUE_CANCEL: ClientQueueCancelEvent;
  MATCH_READY: ClientMatchReadyEvent;
  MOVE: ClientMoveEvent;
  RESIGN: ClientResignEvent;
  PING: ClientPingEvent;
  RESUME: ClientResumeEvent;
}

export interface ServerToClientEvents {
  QUEUE_STATUS: ServerQueueStatusEvent;
  MATCH_FOUND: ServerMatchFoundEvent;
  MATCH_START: ServerMatchStartEvent;
  STATE_SYNC: ServerStateSyncEvent;
  MOVE_ACK: ServerMoveAckEvent;
  MATCH_END: ServerMatchEndEvent;
  ERROR: ServerErrorEvent;
  PONG: ServerPongEvent;
}
