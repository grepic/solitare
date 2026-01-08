import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getLeaderboard(period: 'daily' | 'weekly' | 'allTime' = 'weekly', limit = 100) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startDate = new Date(now);
        startDate.setDate(now.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'allTime':
        startDate = new Date(0);
        break;
    }

    // Get top players by wins and earnings
    const players = await this.prisma.user.findMany({
      where: {
        isActive: true,
        profile: {
          totalMatches: { gt: 0 },
        },
      },
      include: {
        profile: true,
        matchPlayers: {
          where: {
            match: {
              finishedAt: { gte: startDate },
              status: 'FINISHED',
            },
          },
        },
      },
      take: limit,
    });

    const leaderboard = players
      .map((player) => {
        const periodWins = player.matchPlayers.filter((mp) => mp.isWinner).length;
        const periodMatches = player.matchPlayers.length;
        const periodEarnings = player.matchPlayers.reduce((sum, mp) => sum + mp.payoutCents, 0);

        return {
          userId: player.id,
          nickname: player.nickname,
          avatarUrl: player.avatarUrl,
          wins: periodWins,
          totalMatches: periodMatches,
          winRate: periodMatches > 0 ? (periodWins / periodMatches) * 100 : 0,
          totalEarnings: periodEarnings,
        };
      })
      .sort((a, b) => {
        // Sort by earnings, then wins, then win rate
        if (b.totalEarnings !== a.totalEarnings) return b.totalEarnings - a.totalEarnings;
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.winRate - a.winRate;
      })
      .slice(0, limit)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    return leaderboard;
  }

  async getUserRank(userId: string, period: 'daily' | 'weekly' | 'allTime' = 'weekly') {
    const leaderboard = await this.getLeaderboard(period, 10000);
    const userEntry = leaderboard.find((entry) => entry.userId === userId);

    return userEntry || null;
  }
}
