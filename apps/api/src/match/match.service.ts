import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MatchTier, MatchStatus, TransactionType } from '@prisma/client';
import { MATCH_TIER_CONFIG } from '@solitaire/shared';
import { nanoid } from 'nanoid';
import { hashDeck, createDeck, shuffleDeck } from '@solitaire/engine';
import { WalletService } from '../wallet/wallet.service';

@Injectable()
export class MatchService {
  constructor(
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {}

  async createMatch(tier: MatchTier, player1Id: string, player2Id: string) {
    const config = MATCH_TIER_CONFIG[tier];
    const seed = nanoid(32);
    const deck = createDeck();
    const shuffled = shuffleDeck(deck, seed);
    const deckHashValue = hashDeck(shuffled);

    // Lock funds for both players (only for cash matches)
    if (!config.isPractice) {
      await this.walletService.lockFunds(player1Id, config.entryFeeCents, {
        reason: 'match_entry',
      });
      await this.walletService.lockFunds(player2Id, config.entryFeeCents, {
        reason: 'match_entry',
      });
    }

    const match = await this.prisma.match.create({
      data: {
        tier,
        entryFeeCents: config.entryFeeCents,
        prizePoolCents: config.prizePoolCents,
        platformFeeCents: config.platformFeeCents,
        status: MatchStatus.READY_CHECK,
        seed,
        deckHash: deckHashValue,
        players: {
          create: [
            { userId: player1Id, position: 0 },
            { userId: player2Id, position: 1 },
          ],
        },
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
                  select: {
                    level: true,
                    wins: true,
                    totalMatches: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return match;
  }

  async startMatch(matchId: string) {
    return this.prisma.match.update({
      where: { id: matchId },
      data: {
        status: MatchStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });
  }

  async recordMove(matchId: string, userId: string, seq: number, moveType: string, payload: any) {
    await this.prisma.matchMove.create({
      data: {
        matchId,
        userId,
        seq,
        moveType,
        payload,
      },
    });

    await this.prisma.matchPlayer.update({
      where: {
        matchId_userId: {
          matchId,
          userId,
        },
      },
      data: {
        lastSeq: seq,
      },
    });
  }

  async finishMatch(
    matchId: string,
    winnerId: string | null,
    player1Stats: { timeMs: number; score: number },
    player2Stats: { timeMs: number; score: number },
  ) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: { players: true },
    });

    if (!match) {
      throw new NotFoundException('Match not found');
    }

    if (match.status === MatchStatus.FINISHED) {
      throw new BadRequestException('Match already finished');
    }

    const config = MATCH_TIER_CONFIG[match.tier];
    const player1 = match.players.find((p) => p.position === 0)!;
    const player2 = match.players.find((p) => p.position === 1)!;

    await this.prisma.$transaction(async (tx) => {
      // Update match status
      await tx.match.update({
        where: { id: matchId },
        data: {
          status: MatchStatus.FINISHED,
          finishedAt: new Date(),
          winnerId,
        },
      });

      // Update player stats
      await tx.matchPlayer.update({
        where: {
          matchId_userId: {
            matchId,
            userId: player1.userId,
          },
        },
        data: {
          finalTimeMs: player1Stats.timeMs,
          finalScore: player1Stats.score,
          isWinner: winnerId === player1.userId,
          payoutCents: winnerId === player1.userId ? config.prizePoolCents : 0,
        },
      });

      await tx.matchPlayer.update({
        where: {
          matchId_userId: {
            matchId,
            userId: player2.userId,
          },
        },
        data: {
          finalTimeMs: player2Stats.timeMs,
          finalScore: player2Stats.score,
          isWinner: winnerId === player2.userId,
          payoutCents: winnerId === player2.userId ? config.prizePoolCents : 0,
        },
      });

      // Update user profiles
      if (winnerId) {
        await tx.userProfile.update({
          where: { userId: winnerId },
          data: {
            wins: { increment: 1 },
            totalMatches: { increment: 1 },
            xp: { increment: 100 },
          },
        });

        const loserId = winnerId === player1.userId ? player2.userId : player1.userId;
        await tx.userProfile.update({
          where: { userId: loserId },
          data: {
            losses: { increment: 1 },
            totalMatches: { increment: 1 },
            xp: { increment: 25 },
          },
        });
      }

      // Process payouts for cash matches
      if (!config.isPractice) {
        // Unlock and deduct entry fees
        await this.walletService.unlockFunds(player1.userId, config.entryFeeCents);
        await this.walletService.unlockFunds(player2.userId, config.entryFeeCents);

        await this.walletService.deductFunds(
          player1.userId,
          config.entryFeeCents,
          TransactionType.ENTRY_FEE,
          { matchId },
        );

        await this.walletService.deductFunds(
          player2.userId,
          config.entryFeeCents,
          TransactionType.ENTRY_FEE,
          { matchId },
        );

        // Award winner
        if (winnerId) {
          await this.walletService.addFunds(
            winnerId,
            config.prizePoolCents,
            TransactionType.WINNING,
            undefined,
            { matchId },
          );
        } else {
          // Tie - refund both
          await this.walletService.addFunds(
            player1.userId,
            config.entryFeeCents,
            TransactionType.REFUND,
            undefined,
            { matchId },
          );
          await this.walletService.addFunds(
            player2.userId,
            config.entryFeeCents,
            TransactionType.REFUND,
            undefined,
            { matchId },
          );
        }
      }
    });
  }

  async getMatch(matchId: string) {
    return this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          include: {
            user: {
              select: {
                id: true,
                nickname: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });
  }

  async getMatchMoves(matchId: string, userId: string, fromSeq = 0) {
    return this.prisma.matchMove.findMany({
      where: {
        matchId,
        userId,
        seq: { gte: fromSeq },
      },
      orderBy: { seq: 'asc' },
    });
  }

  async getLobbyTiers() {
    return Object.entries(MATCH_TIER_CONFIG).map(([tier, config]) => ({
      tier: tier as MatchTier,
      entryFeeCents: config.entryFeeCents,
      prizePoolCents: config.prizePoolCents,
      platformFeeCents: config.platformFeeCents,
      winnerPayout: config.prizePoolCents,
      isPractice: config.isPractice,
    }));
  }

  async getMatchReplay(matchId: string, userId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
      include: {
        players: {
          where: { userId },
        },
        moves: {
          where: { userId },
          orderBy: { seq: 'asc' },
        },
      },
    });

    if (!match || match.players.length === 0) {
      throw new Error('Match not found or you were not a participant');
    }

    return {
      matchId: match.id,
      seed: match.seed,
      moves: match.moves,
      finalScore: match.players[0]?.finalScore,
      finalTimeMs: match.players[0]?.finalTimeMs,
      isWinner: match.players[0]?.isWinner,
    };
  }
}
