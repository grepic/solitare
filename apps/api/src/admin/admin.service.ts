import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getUsers(search?: string, limit = 50) {
    return this.prisma.user.findMany({
      where: search ? { OR: [{ email: { contains: search } }, { nickname: { contains: search } }] } : undefined,
      include: { profile: true, wallet: true },
      take: limit,
    });
  }

  async banUser(userId: string, reason: string, durationDays?: number) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: false } });
  }

  async unbanUser(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { isActive: true } });
  }

  async getPendingAgeVerifications() {
    return this.prisma.ageVerificationRequest.findMany({
      where: { status: TransactionStatus.PENDING },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async approveAgeVerification(requestId: string, adminId: string) {
    const request = await this.prisma.ageVerificationRequest.update({
      where: { id: requestId },
      data: { status: TransactionStatus.COMPLETED, reviewedBy: adminId, reviewedAt: new Date() },
    });

    await this.prisma.userProfile.update({
      where: { userId: request.userId },
      data: { ageVerified: true },
    });

    return { success: true };
  }

  async rejectAgeVerification(requestId: string, adminId: string, reason: string) {
    await this.prisma.ageVerificationRequest.update({
      where: { id: requestId },
      data: { status: TransactionStatus.FAILED, reviewedBy: adminId, reviewedAt: new Date(), reviewNotes: reason },
    });

    return { success: true };
  }

  async getPendingWithdrawals() {
    return this.prisma.withdrawalRequest.findMany({
      where: { status: TransactionStatus.PENDING },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async createDailyChallenge(targetScore: number, targetTime: number, rewardCents: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.dailyChallenge.create({
      data: { date: today, targetScore, targetTime, rewardCents },
    });
  }

  async getPlatformStats() {
    const [totalUsers, activeUsers, totalMatches, totalRevenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.match.count(),
      this.prisma.transaction.aggregate({ where: { type: 'ENTRY_FEE' }, _sum: { amountCents: true } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      totalMatches,
      totalRevenueCents: totalRevenue._sum.amountCents || 0,
    };
  }

  async getStats() {
    return this.getPlatformStats();
  }

  async getWithdrawalRequests(status?: TransactionStatus) {
    return this.prisma.withdrawalRequest.findMany({
      where: status ? { status } : undefined,
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async createAuditLog(userId: string, action: string, entity: string, entityId: string, changes: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        changes,
      },
    });
  }

  async getRevenueStats() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get revenue from finished games (platform fee)
    const [todayGames, weekGames, monthGames, allGames, activeGames, totalPlayers] = await Promise.all([
      this.prisma.game.aggregate({
        where: { status: 'FINISHED', finishedAt: { gte: todayStart } },
        _sum: { platformFeeCents: true },
        _count: true,
        _avg: { maxPlayers: true },
      }),
      this.prisma.game.aggregate({
        where: { status: 'FINISHED', finishedAt: { gte: weekStart } },
        _sum: { platformFeeCents: true },
      }),
      this.prisma.game.aggregate({
        where: { status: 'FINISHED', finishedAt: { gte: monthStart } },
        _sum: { platformFeeCents: true },
      }),
      this.prisma.game.aggregate({
        where: { status: 'FINISHED' },
        _sum: { platformFeeCents: true },
      }),
      this.prisma.game.count({
        where: { status: { in: ['WAITING', 'READY_CHECK', 'IN_PROGRESS'] } },
      }),
      this.prisma.user.count({ where: { isActive: true } }),
    ]);

    return {
      todayRevenue: todayGames._sum.platformFeeCents || 0,
      weekRevenue: weekGames._sum.platformFeeCents || 0,
      monthRevenue: monthGames._sum.platformFeeCents || 0,
      totalRevenue: allGames._sum.platformFeeCents || 0,
      activeGames,
      completedGamesToday: todayGames._count || 0,
      totalPlayers,
      averageGameSize: todayGames._avg.maxPlayers || 0,
    };
  }
}
