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
import { UseGuards, Logger } from '@nestjs/common';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { GamesService } from '../games/games.service';
import {
  GameLobbyEvent,
  GameCreatePayload,
  GameJoinPayload,
  GameLeavePayload,
  GameReadyPayload,
  LobbyUpdatePayload,
  GameStartingPayload,
  PlayerFinishedPayload,
  GameFinishedPayload,
  GAME_LOBBY_CONFIG,
  MatchTier,
  GameStatus,
} from '@solitaire/shared';

interface AuthenticatedSocket extends Socket {
  userId: string;
}

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/lobby',
})
export class LobbyGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LobbyGateway.name);
  private lobbyBroadcastInterval: NodeJS.Timeout | null = null;
  private subscribedClients: Map<string, MatchTier | null> = new Map(); // socketId -> tier filter

  constructor(private readonly gamesService: GamesService) {
    // Start periodic lobby broadcast
    this.startLobbyBroadcast();
  }

  /**
   * Handle client connection
   */
  handleConnection(client: AuthenticatedSocket) {
    this.logger.log(`Client connected to lobby: ${client.id}`);
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected from lobby: ${client.id}`);
    this.subscribedClients.delete(client.id);
  }

  /**
   * LOBBY_SUBSCRIBE - Client subscribes to lobby updates
   */
  @SubscribeMessage(GameLobbyEvent.LOBBY_SUBSCRIBE)
  @UseGuards(WsJwtGuard)
  async handleLobbySubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { tier?: MatchTier },
  ) {
    this.logger.log(
      `User ${client.userId} subscribed to lobby${data.tier ? ` (tier: ${data.tier})` : ''}`,
    );

    // Track subscription
    this.subscribedClients.set(client.id, data.tier || null);

    // Immediately send current lobby state
    const lobbies = await this.gamesService.getActiveLobbies(data.tier);
    const payload: LobbyUpdatePayload = {
      games: this.formatLobbyCards(lobbies),
      timestamp: Date.now(),
    };

    client.emit(GameLobbyEvent.LOBBY_UPDATE, payload);

    return { success: true };
  }

  /**
   * LOBBY_UNSUBSCRIBE - Client unsubscribes from lobby updates
   */
  @SubscribeMessage(GameLobbyEvent.LOBBY_UNSUBSCRIBE)
  @UseGuards(WsJwtGuard)
  handleLobbyUnsubscribe(@ConnectedSocket() client: AuthenticatedSocket) {
    this.logger.log(`User ${client.userId} unsubscribed from lobby`);
    this.subscribedClients.delete(client.id);
    return { success: true };
  }

  /**
   * GAME_CREATE - Create a new game lobby
   */
  @SubscribeMessage(GameLobbyEvent.GAME_CREATE)
  @UseGuards(WsJwtGuard)
  async handleGameCreate(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: GameCreatePayload,
  ) {
    try {
      const game = await this.gamesService.createGameLobby(
        {
          name: data.name,
          tier: data.tier,
          maxPlayers: data.maxPlayers,
          isLimited: data.isLimited,
          durationMinutes: data.durationMinutes,
        },
        client.userId,
      );

      this.logger.log(
        `User ${client.userId} created game ${game.id} (${game.name})`,
      );

      // Broadcast lobby update to all subscribers
      await this.broadcastLobbyUpdate();

      return { success: true, gameId: game.id };
    } catch (error) {
      this.logger.error(`Failed to create game: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  /**
   * GAME_JOIN - Join an existing game
   */
  @SubscribeMessage(GameLobbyEvent.GAME_JOIN)
  @UseGuards(WsJwtGuard)
  async handleGameJoin(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: GameJoinPayload,
  ) {
    try {
      const game = await this.gamesService.joinGame({
        gameId: data.gameId,
        userId: client.userId,
      });

      this.logger.log(`User ${client.userId} joined game ${game.id}`);

      // Join socket room for this game
      client.join(`game:${game.id}`);

      // Notify all players in game
      this.server.to(`game:${game.id}`).emit(GameLobbyEvent.GAME_JOINED, {
        gameId: game.id,
        userId: client.userId,
        currentPlayers: game.currentPlayers,
        maxPlayers: game.maxPlayers,
      });

      // Broadcast lobby update
      await this.broadcastLobbyUpdate();

      // If game is full, start ready check
      if (game.currentPlayers === game.maxPlayers) {
        await this.startReadyCheckCountdown(game.id);
      }

      return { success: true, game };
    } catch (error) {
      this.logger.error(`Failed to join game: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  /**
   * GAME_LEAVE - Leave a game before it starts
   */
  @SubscribeMessage(GameLobbyEvent.GAME_LEAVE)
  @UseGuards(WsJwtGuard)
  async handleGameLeave(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: GameLeavePayload,
  ) {
    try {
      await this.gamesService.leaveGame(data.gameId, client.userId);

      this.logger.log(`User ${client.userId} left game ${data.gameId}`);

      // Leave socket room
      client.leave(`game:${data.gameId}`);

      // Notify remaining players
      this.server.to(`game:${data.gameId}`).emit(GameLobbyEvent.GAME_LEFT, {
        gameId: data.gameId,
        userId: client.userId,
      });

      // Broadcast lobby update
      await this.broadcastLobbyUpdate();

      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to leave game: ${(error as any).message}`);
      return { success: false, error: (error as any).message };
    }
  }

  /**
   * GAME_READY - Mark player as ready (optional for future use)
   */
  @SubscribeMessage(GameLobbyEvent.GAME_READY)
  @UseGuards(WsJwtGuard)
  async handleGameReady(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: GameReadyPayload,
  ) {
    // Mark player as ready in database
    // This could be used for a manual ready check system
    return { success: true };
  }

  /**
   * Start ready check countdown when game is full
   */
  private async startReadyCheckCountdown(gameId: string) {
    const game = await this.gamesService.getGameById(gameId);

    const payload: GameStartingPayload = {
      gameId: game.id,
      countdownMs: GAME_LOBBY_CONFIG.READY_CHECK_DURATION_MS,
      players: game.players.map((p) => ({
        userId: p.userId,
        nickname: p.user.nickname,
        avatarUrl: p.user.avatarUrl,
        position: p.position,
      })),
    };

    // Notify all players in game
    this.server.to(`game:${gameId}`).emit(GameLobbyEvent.GAME_STARTING, payload);

    // Schedule game start after countdown
    setTimeout(async () => {
      await this.gamesService.startGame(gameId);

      // Notify game started
      this.server.to(`game:${gameId}`).emit(GameLobbyEvent.GAME_STARTED, {
        gameId,
        startedAt: new Date().toISOString(),
      });

      // Remove from lobby broadcast
      await this.broadcastLobbyUpdate();
    }, GAME_LOBBY_CONFIG.READY_CHECK_DURATION_MS);
  }

  /**
   * Notify when a player finishes their game
   */
  async notifyPlayerFinished(payload: PlayerFinishedPayload) {
    this.server.to(`game:${payload.gameId}`).emit(
      GameLobbyEvent.PLAYER_FINISHED,
      payload,
    );
  }

  /**
   * Notify when game is finished with final results
   */
  async notifyGameFinished(payload: GameFinishedPayload) {
    this.server.to(`game:${payload.gameId}`).emit(
      GameLobbyEvent.GAME_FINISHED,
      payload,
    );

    // Remove from lobby
    await this.broadcastLobbyUpdate();
  }

  /**
   * Notify when game is cancelled
   */
  async notifyGameCancelled(gameId: string, reason: string) {
    this.server.to(`game:${gameId}`).emit(GameLobbyEvent.GAME_CANCELLED, {
      gameId,
      reason,
    });

    // Remove from lobby
    await this.broadcastLobbyUpdate();
  }

  /**
   * Start periodic lobby broadcast (every 5 seconds)
   */
  private startLobbyBroadcast() {
    this.lobbyBroadcastInterval = setInterval(async () => {
      await this.broadcastLobbyUpdate();
    }, GAME_LOBBY_CONFIG.LOBBY_UPDATE_INTERVAL_MS);

    this.logger.log('Lobby broadcast started');
  }

  /**
   * Broadcast lobby update to all subscribed clients
   */
  private async broadcastLobbyUpdate() {
    try {
      // Get all active lobbies
      const allLobbies = await this.gamesService.getActiveLobbies();

      // Send to all subscribed clients (with tier filtering)
      for (const [socketId, tierFilter] of this.subscribedClients.entries()) {
        const lobbies = tierFilter
          ? allLobbies.filter((g) => g.tier === tierFilter)
          : allLobbies;

        const payload: LobbyUpdatePayload = {
          games: this.formatLobbyCards(lobbies),
          timestamp: Date.now(),
        };

        this.server.to(socketId).emit(GameLobbyEvent.LOBBY_UPDATE, payload);
      }
    } catch (error) {
      this.logger.error(`Failed to broadcast lobby update: ${(error as any).message}`);
    }
  }

  /**
   * Format game data for lobby cards
   */
  private formatLobbyCards(games: any[]) {
    return games.map((game) => {
      const playerProgress =
        game.maxPlayers > 0
          ? Math.floor((game.currentPlayers / game.maxPlayers) * 100)
          : 0;

      const timeRemainingMs =
        game.isLimited && game.endsAt
          ? Math.max(0, new Date(game.endsAt).getTime() - Date.now())
          : null;

      return {
        id: game.id,
        name: game.name,
        tier: game.tier,
        entryFeeCents: game.entryFeeCents,
        prizePoolCents: game.prizePoolCents,
        prizeDistribution: game.prizeDistribution,
        maxPlayers: game.maxPlayers,
        currentPlayers: game.currentPlayers,
        status: game.status,
        playerProgress,
        isLimited: game.isLimited,
        endsAt: game.endsAt,
        timeRemainingMs,
      };
    });
  }

  /**
   * Stop lobby broadcast on gateway destroy
   */
  onModuleDestroy() {
    if (this.lobbyBroadcastInterval) {
      clearInterval(this.lobbyBroadcastInterval);
      this.logger.log('Lobby broadcast stopped');
    }
  }
}
