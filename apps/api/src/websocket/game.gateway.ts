import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { MatchService } from '../match/match.service';
import { MatchmakingService } from '../match/matchmaking.service';
import { MATCH_CONSTANTS, MATCH_TIER_CONFIG } from '@solitaire/shared';
import { MatchStatus } from '@prisma/client';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  currentMatchId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private matchRooms = new Map<string, Set<string>>(); // matchId -> Set<userId>
  private matchmakingIntervals = new Map<string, NodeJS.Timeout>(); // tier -> interval

  constructor(
    private matchService: MatchService,
    private matchmakingService: MatchmakingService,
    private jwtService: JwtService,
  ) {
    // Start matchmaking loops for each tier
    this.startMatchmakingLoops();
  }

  async handleConnection(client: AuthenticatedSocket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    console.log(`Client disconnected: ${client.id}`);

    if (client.userId) {
      this.connectedUsers.delete(client.userId);

      if (client.currentMatchId) {
        await this.handleMatchDisconnect(client.userId, client.currentMatchId);
      }
    }
  }

  @SubscribeMessage('AUTH')
  async handleAuth(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { accessToken: string },
  ) {
    try {
      const payload = this.jwtService.verify(data.accessToken);
      client.userId = payload.sub;
      this.connectedUsers.set(client.userId, client.id);

      client.emit('AUTH_SUCCESS', { userId: client.userId });
    } catch (error) {
      client.emit('ERROR', {
        code: 'UNAUTHORIZED',
        message: 'Invalid access token',
      });
      client.disconnect();
    }
  }

  @SubscribeMessage('QUEUE_JOIN')
  async handleQueueJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { tier: string },
  ) {
    if (!client.userId) {
      return this.sendError(client, 'UNAUTHORIZED', 'Not authenticated');
    }

    try {
      await this.matchmakingService.joinQueue(client.userId, data.tier as any);

      const position = await this.matchmakingService.getQueuePosition(
        client.userId,
        data.tier as any,
      );

      client.emit('QUEUE_STATUS', {
        position,
        estimatedWaitSeconds: position * 5, // Simple estimation
      });
    } catch (error) {
      this.sendError(client, 'QUEUE_ERROR', (error as Error).message);
    }
  }

  @SubscribeMessage('QUEUE_CANCEL')
  async handleQueueCancel(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { tier: string },
  ) {
    if (!client.userId) return;

    await this.matchmakingService.leaveQueue(client.userId, data.tier as any);
    client.emit('QUEUE_CANCELLED', {});
  }

  @SubscribeMessage('MATCH_READY')
  async handleMatchReady(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    if (!client.userId) return;

    try {
      // Update player ready status
      await this.matchService.getMatch(data.matchId);

      client.join(`match:${data.matchId}`);
      client.currentMatchId = data.matchId;

      // Check if both players are ready
      const room = this.matchRooms.get(data.matchId) || new Set();
      room.add(client.userId);
      this.matchRooms.set(data.matchId, room);

      if (room.size === 2) {
        // Start match
        await this.matchService.startMatch(data.matchId);

        const startAt = Date.now() + 3000; // 3 second countdown

        this.server.to(`match:${data.matchId}`).emit('MATCH_START', {
          matchId: data.matchId,
          serverTime: Date.now(),
          startAt,
        });
      }
    } catch (error) {
      this.sendError(client, 'MATCH_ERROR', (error as Error).message);
    }
  }

  @SubscribeMessage('MOVE')
  async handleMove(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string; seq: number; moveType: string; payload: any },
  ) {
    if (!client.userId) return;

    try {
      // Rate limiting check (simple)
      // In production, use Redis-based rate limiting

      // Record move
      await this.matchService.recordMove(
        data.matchId,
        client.userId,
        data.seq,
        data.moveType,
        data.payload,
      );

      // Acknowledge
      client.emit('MOVE_ACK', {
        matchId: data.matchId,
        seq: data.seq,
        valid: true,
      });

      // Notify opponent of progress (optional)
      const room = this.matchRooms.get(data.matchId);
      if (room) {
        room.forEach((userId) => {
          if (userId !== client.userId) {
            const socketId = this.connectedUsers.get(userId);
            if (socketId) {
              this.server.to(socketId).emit('OPPONENT_PROGRESS', {
                lastMoveAt: Date.now(),
                movesCount: data.seq,
              });
            }
          }
        });
      }
    } catch (error) {
      client.emit('MOVE_ACK', {
        matchId: data.matchId,
        seq: data.seq,
        valid: false,
        reason: (error as Error).message,
      });
    }
  }

  @SubscribeMessage('RESIGN')
  async handleResign(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { matchId: string },
  ) {
    if (!client.userId) return;

    const match = await this.matchService.getMatch(data.matchId);
    if (!match) return;

    const opponent = match.players.find((p) => p.userId !== client.userId);
    if (!opponent) return;

    await this.matchService.finishMatch(
      data.matchId,
      opponent.userId,
      { timeMs: 999999, score: 0 },
      { timeMs: 0, score: 1000 },
    );

    this.server.to(`match:${data.matchId}`).emit('MATCH_END', {
      matchId: data.matchId,
      winnerId: opponent.userId,
      reason: 'RESIGNATION',
    });

    this.cleanupMatch(data.matchId);
  }

  @SubscribeMessage('PING')
  handlePing(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { timestamp: number },
  ) {
    client.emit('PONG', {
      timestamp: data.timestamp,
      serverTime: Date.now(),
    });
  }

  private startMatchmakingLoops() {
    const tiers = Object.keys(MATCH_TIER_CONFIG);

    tiers.forEach((tier) => {
      const interval = setInterval(async () => {
        const match = await this.matchmakingService.findMatch(tier as any);

        if (match) {
          const [player1Id, player2Id] = match;
          await this.createAndNotifyMatch(tier as any, player1Id, player2Id);
        }
      }, 2000); // Check every 2 seconds

      this.matchmakingIntervals.set(tier, interval);
    });
  }

  private async createAndNotifyMatch(tier: any, player1Id: string, player2Id: string) {
    const match = await this.matchService.createMatch(tier, player1Id, player2Id);

    const config = MATCH_TIER_CONFIG[tier];
    const readyCheckDeadline = Date.now() + MATCH_CONSTANTS.READY_CHECK_TIMEOUT_MS;

    // Notify both players
    [player1Id, player2Id].forEach((userId, index) => {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        const opponent = match.players.find((p) => p.userId !== userId);

        this.server.to(socketId).emit('MATCH_FOUND', {
          matchId: match.id,
          opponent: opponent
            ? {
                id: opponent.user.id,
                nickname: opponent.user.nickname,
                avatarUrl: opponent.user.avatarUrl,
                level: opponent.user.profile?.level || 1,
                winRate:
                  opponent.user.profile && opponent.user.profile.totalMatches > 0
                    ? (opponent.user.profile.wins / opponent.user.profile.totalMatches) * 100
                    : 0,
              }
            : null,
          tier,
          entryFeeCents: config.entryFeeCents,
          prizePoolCents: config.prizePoolCents,
          seed: match.seed,
          rules: {
            drawCount: 1,
            hintsEnabled: false,
            maxTimeMs: MATCH_CONSTANTS.MAX_MATCH_DURATION_MS,
          },
          readyCheckDeadline,
        });
      }
    });
  }

  private async handleMatchDisconnect(userId: string, matchId: string) {
    const match = await this.matchService.getMatch(matchId);

    if (!match || match.status !== MatchStatus.IN_PROGRESS) {
      return;
    }

    // Implement grace period logic here
    // For MVP, we'll just forfeit after disconnect
  }

  private cleanupMatch(matchId: string) {
    this.matchRooms.delete(matchId);
    this.server.in(`match:${matchId}`).socketsLeave(`match:${matchId}`);
  }

  private sendError(client: Socket, code: string, message: string) {
    client.emit('ERROR', { code, message });
  }
}
