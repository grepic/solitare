import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { ComplianceAuditService } from '../common/services/compliance-audit.service';
import {
  MatchTier,
  GameStatus,
  calculateProportionalPayouts,
  MATCH_TIER_CONFIG,
  GAME_LOBBY_CONFIG,
} from '@solitaire/shared';
// import { SolitaireEngine } from '@solitaire/engine';
// NOTE: Game engine not needed for lobby system (client-side gameplay)

export interface CreateGameLobbyDto {
  name: string;
  tier: MatchTier;
  maxPlayers: number;
  isLimited?: boolean;
  durationMinutes?: number;
}

export interface JoinGameDto {
  gameId: string;
  userId: string;
}

export interface FinishGamePlayerDto {
  userId: string;
  completionTimeMs: number;
  finalScore: number;
  moveCount: number;
}

@Injectable()
export class GamesService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
    private complianceAuditService: ComplianceAuditService,
  ) {}

  /**
   * Create a new game lobby
   */
  async createGameLobby(dto: CreateGameLobbyDto, creatorUserId?: string) {
    const tierConfig = MATCH_TIER_CONFIG[dto.tier];

    if (!tierConfig) {
      throw new BadRequestException('Invalid tier');
    }

    // Validate player count
    if (dto.maxPlayers < 2 || dto.maxPlayers > 10) {
      throw new BadRequestException('Max players must be between 2 and 10');
    }

    // Generate deterministic deck seed
    const seed = Math.random().toString(36).substring(2);
    // const engine = new SolitaireEngine(seed);
    // const deckHash = engine.getDeckHash();
    const deckHash = seed; // Placeholder - deck generation happens client-side

    // Calculate prize distribution
    const prizeDistribution = calculateProportionalPayouts(
      tierConfig.prizePoolCents,
      dto.maxPlayers,
    );

    // Calculate end time for limited tournaments
    const endsAt = dto.isLimited && dto.durationMinutes
      ? new Date(Date.now() + dto.durationMinutes * 60 * 1000)
      : null;

    const game = await this.prisma.game.create({
      data: {
        name: dto.name,
        tier: dto.tier,
        maxPlayers: dto.maxPlayers,
        entryFeeCents: tierConfig.entryFeeCents,
        prizePoolCents: tierConfig.prizePoolCents,
        platformFeeCents: tierConfig.platformFeeCents,
        prizeDistribution: prizeDistribution,
        seed,
        deckHash,
        isLimited: dto.isLimited || false,
        endsAt,
        status: GameStatus.WAITING,
      },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                profile: {
                  select: { level: true },
                },
              },
            },
          },
        },
      },
    });

    // If creator provided, auto-join them
    if (creatorUserId) {
      await this.joinGame({ gameId: game.id, userId: creatorUserId });
    }

    return game;
  }

  /**
   * Join an existing game lobby
   */
  async joinGame(dto: JoinGameDto) {
    const game = await this.prisma.game.findUnique({
      where: { id: dto.gameId },
      include: {
        players: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.WAITING) {
      throw new BadRequestException('Game is not accepting players');
    }

    if (game.currentPlayers >= game.maxPlayers) {
      throw new BadRequestException('Game is full');
    }

    // Check if player already joined
    const existingPlayer = game.players.find((p) => p.userId === dto.userId);
    if (existingPlayer) {
      throw new BadRequestException('Already joined this game');
    }

    // Check if game expired (limited-time)
    if (game.isLimited && game.endsAt && new Date() > game.endsAt) {
      await this.cancelGame(game.id, 'expired');
      throw new BadRequestException('Game has expired');
    }

    // Deduct entry fee from wallet (lock funds)
    const tierConfig = MATCH_TIER_CONFIG[game.tier];
    if (!tierConfig.isPractice) {
      await this.walletService.debit(
        dto.userId,
        tierConfig.entryFeeCents,
        'ENTRY_FEE' as any,
        `Game entry fee: ${game.name}`,
      );
    }

    // Add player to game
    const position = game.currentPlayers;
    await this.prisma.gamePlayer.create({
      data: {
        gameId: game.id,
        userId: dto.userId,
        position,
      },
    });

    // Update game player count
    const updatedGame = await this.prisma.game.update({
      where: { id: game.id },
      data: {
        currentPlayers: { increment: 1 },
      },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                profile: { select: { level: true } },
              },
            },
          },
        },
      },
    });

    // Check if game is now full -> start ready check
    if (updatedGame.currentPlayers === updatedGame.maxPlayers) {
      await this.startReadyCheck(updatedGame.id);
    }

    await this.complianceAuditService.log({
      userId: dto.userId,
      action: 'GAME_JOIN',
      resource: 'game',
      resourceId: game.id,
      metadata: {
        tier: game.tier,
        entryFeeCents: tierConfig.entryFeeCents,
      },
      ipAddress: null,
      userAgent: null,
    });

    return updatedGame;
  }

  /**
   * Leave a game lobby (before it starts)
   */
  async leaveGame(gameId: string, userId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.WAITING) {
      throw new BadRequestException('Cannot leave after game has started');
    }

    const player = game.players.find((p) => p.userId === userId);
    if (!player) {
      throw new BadRequestException('Not in this game');
    }

    // Refund entry fee
    const tierConfig = MATCH_TIER_CONFIG[game.tier];
    if (!tierConfig.isPractice) {
      await this.walletService.credit(
        userId,
        tierConfig.entryFeeCents,
        'REFUND' as any,
        `Game left: ${game.name}`,
      );
    }

    // Remove player
    await this.prisma.gamePlayer.delete({
      where: {
        gameId_userId: {
          gameId,
          userId,
        },
      },
    });

    // Update game player count
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        currentPlayers: { decrement: 1 },
      },
    });

    // If no players left, cancel game
    if (game.currentPlayers === 1) {
      await this.cancelGame(gameId, 'no_players');
    }

    return { success: true };
  }

  /**
   * Start ready check countdown when game is full
   */
  async startReadyCheck(gameId: string) {
    const now = new Date();

    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GameStatus.READY_CHECK,
        readyCheckStartAt: now,
      },
    });

    // Schedule auto-start after countdown
    // (This should be handled by WebSocket gateway or a scheduler)
  }

  /**
   * Start the game (after ready check)
   */
  async startGame(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.READY_CHECK) {
      throw new BadRequestException('Game is not in ready check');
    }

    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GameStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Finish the game and calculate proportional payouts
   */
  async finishGame(gameId: string, playerResults: FinishGamePlayerDto[]) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException('Game is not in progress');
    }

    // Sort players by completion time (fastest first)
    const rankedResults = [...playerResults].sort(
      (a, b) => a.completionTimeMs - b.completionTimeMs,
    );

    // Calculate proportional payouts
    const payouts = calculateProportionalPayouts(
      game.prizePoolCents,
      game.maxPlayers,
    );

    // Update player results and credit wallets
    const tierConfig = MATCH_TIER_CONFIG[game.tier];

    for (let i = 0; i < rankedResults.length; i++) {
      const result = rankedResults[i];
      const placement = i + 1;
      const payoutCents = payouts[i] || 0;
      const payoutPercentage = payoutCents > 0
        ? (payoutCents / game.prizePoolCents) * 100
        : 0;

      // Update game player record
      await this.prisma.gamePlayer.update({
        where: {
          gameId_userId: {
            gameId: game.id,
            userId: result.userId,
          },
        },
        data: {
          placement,
          completionTimeMs: result.completionTimeMs,
          finalScore: result.finalScore,
          moveCount: result.moveCount,
          payoutCents,
          payoutPercentage,
          isFinished: true,
          finishedAt: new Date(),
        },
      });

      // Credit wallet if payout > 0
      if (payoutCents > 0 && !tierConfig.isPractice) {
        await this.walletService.credit(
          result.userId,
          payoutCents,
          'WINNING' as any,
          `${placement}${this.getOrdinalSuffix(placement)} place: ${game.name}`,
        );
      }

      // Update user stats
      await this.prisma.userProfile.update({
        where: { userId: result.userId },
        data: {
          totalMatches: { increment: 1 },
          wins: placement === 1 ? { increment: 1 } : undefined,
          losses: placement > 1 ? { increment: 1 } : undefined,
          xp: { increment: Math.max(50 - (placement - 1) * 10, 10) },
        },
      });

      // Audit log
      await this.complianceAuditService.log({
        userId: result.userId,
        action: 'GAME_FINISH',
        resource: 'game',
        resourceId: game.id,
        metadata: {
          placement,
          payoutCents,
          completionTimeMs: result.completionTimeMs,
        },
        ipAddress: null,
        userAgent: null,
      });
    }

    // Mark game as finished
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GameStatus.FINISHED,
        finishedAt: new Date(),
      },
    });

    return { success: true, results: rankedResults };
  }

  /**
   * Cancel a game and refund all players
   */
  async cancelGame(gameId: string, reason: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: { players: true },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Refund all players
    const tierConfig = MATCH_TIER_CONFIG[game.tier];
    if (!tierConfig.isPractice) {
      for (const player of game.players) {
        await this.walletService.credit(
          player.userId,
          tierConfig.entryFeeCents,
          'REFUND' as any,
          `Game cancelled: ${reason}`,
        );
      }
    }

    // Mark as cancelled
    await this.prisma.game.update({
      where: { id: gameId },
      data: {
        status: GameStatus.CANCELLED,
        finishedAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Get all active game lobbies (for lobby browser)
   */
  async getActiveLobbies(tier?: MatchTier) {
    const games = await this.prisma.game.findMany({
      where: {
        status: {
          in: [GameStatus.WAITING, GameStatus.READY_CHECK],
        },
        tier: tier || undefined,
        OR: [
          { isLimited: false },
          {
            isLimited: true,
            endsAt: { gt: new Date() },
          },
        ],
      },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                profile: { select: { level: true } },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: GAME_LOBBY_CONFIG.MAX_VISIBLE_LOBBIES,
    });

    return games;
  }

  /**
   * Get game by ID with full details
   */
  async getGameById(gameId: string) {
    const game = await this.prisma.game.findUnique({
      where: { id: gameId },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
                profile: { select: { level: true } },
              },
            },
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return game;
  }

  /**
   * Check and cancel expired limited-time games
   */
  async cleanupExpiredGames() {
    const expiredGames = await this.prisma.game.findMany({
      where: {
        isLimited: true,
        endsAt: { lt: new Date() },
        status: GameStatus.WAITING,
      },
    });

    for (const game of expiredGames) {
      await this.cancelGame(game.id, 'expired');
    }

    return { cancelled: expiredGames.length };
  }

  // Helper method
  private getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }
}
