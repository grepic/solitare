/**
 * Game Lobby Types (Multi-Player Solitaire Smash Style)
 */

import { MatchTier } from './match.types';

export enum GameStatus {
  WAITING = 'WAITING',           // Accepting players in lobby
  READY_CHECK = 'READY_CHECK',   // Countdown before start
  IN_PROGRESS = 'IN_PROGRESS',   // Game started
  FINISHED = 'FINISHED',         // Completed
  CANCELLED = 'CANCELLED',       // Cancelled or expired
}

export interface Game {
  id: string;
  name: string;
  description?: string;

  tier: MatchTier;
  maxPlayers: number;
  currentPlayers: number;
  status: GameStatus;

  // Prize & Payment
  entryFeeCents: number;
  prizePoolCents: number;
  platformFeeCents: number;
  prizeDistribution: number[]; // [50, 30, 15, 5] percentages

  // Game Configuration
  seed: string;
  deckHash: string;

  // Timing
  readyCheckStartAt: Date | null;
  startedAt: Date | null;
  finishedAt: Date | null;

  // Limited-Time Tournaments
  isLimited: boolean;
  endsAt: Date | null;

  // Relations
  players: GamePlayer[];

  createdAt: Date;
  updatedAt: Date;
}

export interface GamePlayer {
  gameId: string;
  userId: string;
  position: number;
  joinedAt: Date;

  // Completion & Results
  placement: number | null;       // 1st, 2nd, 3rd, 4th...
  completionTimeMs: number | null;
  finalScore: number | null;
  moveCount: number;

  // Payout
  payoutCents: number | null;
  payoutPercentage: number | null;

  // State Tracking
  isReady: boolean;
  isFinished: boolean;
  finishedAt: Date | null;

  // User details (populated)
  user?: {
    id: string;
    nickname: string;
    avatarUrl: string | null;
    level: number;
  };
}

/**
 * Game lobby card display data (for UI)
 */
export interface GameLobbyCard {
  id: string;
  name: string;
  tier: MatchTier;
  entryFeeCents: number;
  prizePoolCents: number;
  prizeDistribution: number[];
  maxPlayers: number;
  currentPlayers: number;
  status: GameStatus;
  playerProgress: number; // Percentage (0-100)
  isLimited: boolean;
  endsAt: Date | null;
  timeRemainingMs: number | null;
}

/**
 * WebSocket events for game lobbies
 */
export enum GameLobbyEvent {
  // Client -> Server
  LOBBY_SUBSCRIBE = 'LOBBY_SUBSCRIBE',     // Subscribe to lobby updates
  LOBBY_UNSUBSCRIBE = 'LOBBY_UNSUBSCRIBE', // Unsubscribe from lobby updates
  GAME_CREATE = 'GAME_CREATE',             // Create new game lobby
  GAME_JOIN = 'GAME_JOIN',                 // Join existing game
  GAME_LEAVE = 'GAME_LEAVE',               // Leave game before start
  GAME_READY = 'GAME_READY',               // Mark as ready

  // Server -> Client
  LOBBY_UPDATE = 'LOBBY_UPDATE',           // Broadcast lobby state
  GAME_JOINED = 'GAME_JOINED',             // Confirmation of join
  GAME_LEFT = 'GAME_LEFT',                 // Confirmation of leave
  GAME_STARTING = 'GAME_STARTING',         // Ready check countdown
  GAME_STARTED = 'GAME_STARTED',           // Game has started
  GAME_CANCELLED = 'GAME_CANCELLED',       // Game was cancelled
  GAME_FINISHED = 'GAME_FINISHED',         // Game completed
  PLAYER_FINISHED = 'PLAYER_FINISHED',     // A player finished
}

export interface LobbySubscribePayload {
  tier?: MatchTier; // Optional filter by tier
}

export interface GameCreatePayload {
  name: string;
  tier: MatchTier;
  maxPlayers: number;
  isLimited?: boolean;
  durationMinutes?: number; // For limited-time tournaments
}

export interface GameJoinPayload {
  gameId: string;
}

export interface GameLeavePayload {
  gameId: string;
}

export interface GameReadyPayload {
  gameId: string;
}

export interface LobbyUpdatePayload {
  games: GameLobbyCard[];
  timestamp: number;
}

export interface GameStartingPayload {
  gameId: string;
  countdownMs: number;
  players: Array<{
    userId: string;
    nickname: string;
    avatarUrl: string | null;
    position: number;
  }>;
}

export interface PlayerFinishedPayload {
  gameId: string;
  userId: string;
  placement: number;
  completionTimeMs: number;
  finalScore: number;
}

export interface GameFinishedPayload {
  gameId: string;
  results: Array<{
    userId: string;
    nickname: string;
    placement: number;
    completionTimeMs: number;
    finalScore: number;
    payoutCents: number;
    payoutPercentage: number;
  }>;
}
