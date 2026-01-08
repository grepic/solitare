import { Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DepositLimits {
  dailyCents: number | null;
  weeklyCents: number | null;
  monthlyCents: number | null;
}

export interface LossLimits {
  dailyCents: number | null;
  weeklyCents: number | null;
  monthlyCents: number | null;
}

export interface SessionLimits {
  maxDurationMinutes: number | null;
  warningAtMinutes: number | null;
}

export interface SelfExclusion {
  isActive: boolean;
  duration: '24h' | '7d' | '30d' | '6m' | '1y' | 'permanent' | null;
  startDate: Date | null;
  endDate: Date | null;
  reason?: string;
}

export interface RealityCheck {
  timeSpentMinutes: number;
  moneyDepositedCents: number;
  moneyWonCents: number;
  moneyLostCents: number;
  netChangeCents: number;
}

@Injectable()
export class ResponsibleGamingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Set deposit limits for user
   */
  async setDepositLimits(userId: string, limits: DepositLimits): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        depositLimitDaily: limits.dailyCents,
        depositLimitWeekly: limits.weeklyCents,
        depositLimitMonthly: limits.monthlyCents,
        limitsUpdatedAt: new Date(),
      },
    });
  }

  /**
   * Set loss limits for user
   */
  async setLossLimits(userId: string, limits: LossLimits): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lossLimitDaily: limits.dailyCents,
        lossLimitWeekly: limits.weeklyCents,
        lossLimitMonthly: limits.monthlyCents,
        limitsUpdatedAt: new Date(),
      },
    });
  }

  /**
   * Set session time limits
   */
  async setSessionLimits(userId: string, limits: SessionLimits): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        sessionLimitMinutes: limits.maxDurationMinutes,
        sessionWarningMinutes: limits.warningAtMinutes,
      },
    });
  }

  /**
   * Check if user can deposit (within limits)
   */
  async checkDepositLimit(userId: string, amountCents: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        depositLimitDaily: true,
        depositLimitWeekly: true,
        depositLimitMonthly: true,
      },
    });

    if (!user) return false;

    // Get deposits in various time windows
    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const deposits = await this.prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: { gte: monthAgo },
      },
      _sum: { amountCents: true },
    });

    const dailyTotal = deposits
      .filter((d) => d.createdAt >= dayAgo)
      .reduce((sum, d) => sum + (d._sum.amountCents || 0), 0);

    const weeklyTotal = deposits
      .filter((d) => d.createdAt >= weekAgo)
      .reduce((sum, d) => sum + (d._sum.amountCents || 0), 0);

    const monthlyTotal = deposits.reduce((sum, d) => sum + (d._sum.amountCents || 0), 0);

    // Check limits
    if (user.depositLimitDaily && dailyTotal + amountCents > user.depositLimitDaily) {
      throw new ForbiddenException('Daily deposit limit exceeded');
    }

    if (user.depositLimitWeekly && weeklyTotal + amountCents > user.depositLimitWeekly) {
      throw new ForbiddenException('Weekly deposit limit exceeded');
    }

    if (user.depositLimitMonthly && monthlyTotal + amountCents > user.depositLimitMonthly) {
      throw new ForbiddenException('Monthly deposit limit exceeded');
    }

    return true;
  }

  /**
   * Check if user can enter match (within loss limits)
   */
  async checkLossLimit(userId: string, potentialLossCents: number): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        lossLimitDaily: true,
        lossLimitWeekly: true,
        lossLimitMonthly: true,
      },
    });

    if (!user) return false;

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get losses (entry fees without corresponding winnings)
    const losses = await this.prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        type: 'ENTRY_FEE',
        status: 'COMPLETED',
        createdAt: { gte: monthAgo },
      },
      _sum: { amountCents: true },
    });

    const winnings = await this.prisma.transaction.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        type: 'WINNING',
        status: 'COMPLETED',
        createdAt: { gte: monthAgo },
      },
      _sum: { amountCents: true },
    });

    const totalLosses = losses.reduce((sum, l) => sum + (l._sum.amountCents || 0), 0);
    const totalWinnings = winnings.reduce((sum, w) => sum + (w._sum.amountCents || 0), 0);
    const netLoss = Math.max(0, totalLosses - totalWinnings);

    // Similar calculations for daily and weekly
    // (Simplified here for brevity)

    if (user.lossLimitMonthly && netLoss + potentialLossCents > user.lossLimitMonthly) {
      throw new ForbiddenException('Monthly loss limit exceeded. Please review your responsible gaming settings.');
    }

    return true;
  }

  /**
   * Activate self-exclusion for user
   */
  async activateSelfExclusion(
    userId: string,
    duration: '24h' | '7d' | '30d' | '6m' | '1y' | 'permanent',
    reason?: string,
  ): Promise<void> {
    const durationMs = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '6m': 180 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      permanent: null,
    };

    const endDate = durationMs[duration]
      ? new Date(Date.now() + durationMs[duration])
      : null; // null = permanent

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        selfExclusionActive: true,
        selfExclusionStart: new Date(),
        selfExclusionEnd: endDate,
        selfExclusionReason: reason,
      },
    });

    // Cancel any active queues
    // TODO: Implement queue cancellation

    // Log audit event
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'SELF_EXCLUSION_ACTIVATED',
        entity: 'User',
        entityId: userId,
        changes: { duration, reason },
      },
    });
  }

  /**
   * Check if user is currently self-excluded
   */
  async checkSelfExclusion(userId: string): Promise<SelfExclusion> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        selfExclusionActive: true,
        selfExclusionStart: true,
        selfExclusionEnd: true,
        selfExclusionReason: true,
      },
    });

    if (!user || !user.selfExclusionActive) {
      return {
        isActive: false,
        duration: null,
        startDate: null,
        endDate: null,
      };
    }

    // Check if exclusion has expired
    if (user.selfExclusionEnd && user.selfExclusionEnd < new Date()) {
      // Deactivate expired self-exclusion
      await this.prisma.user.update({
        where: { id: userId },
        data: { selfExclusionActive: false },
      });

      return {
        isActive: false,
        duration: null,
        startDate: null,
        endDate: null,
      };
    }

    // Determine duration
    let duration: SelfExclusion['duration'] = 'permanent';
    if (user.selfExclusionEnd) {
      const remainingMs = user.selfExclusionEnd.getTime() - Date.now();
      if (remainingMs < 24 * 60 * 60 * 1000) duration = '24h';
      else if (remainingMs < 7 * 24 * 60 * 60 * 1000) duration = '7d';
      else if (remainingMs < 30 * 24 * 60 * 60 * 1000) duration = '30d';
      else if (remainingMs < 180 * 24 * 60 * 60 * 1000) duration = '6m';
      else duration = '1y';
    }

    return {
      isActive: true,
      duration,
      startDate: user.selfExclusionStart,
      endDate: user.selfExclusionEnd,
      reason: user.selfExclusionReason || undefined,
    };
  }

  /**
   * Enforce self-exclusion (throws if active)
   */
  async enforceSelfExclusion(userId: string): Promise<void> {
    const exclusion = await this.checkSelfExclusion(userId);

    if (exclusion.isActive) {
      const endMsg = exclusion.endDate
        ? ` until ${exclusion.endDate.toLocaleDateString()}`
        : ' permanently';

      throw new ForbiddenException(
        `Your account is self-excluded${endMsg}. If you need help, please contact support or visit our Responsible Gaming resources.`,
      );
    }
  }

  /**
   * Get reality check for user session
   */
  async getRealityCheck(userId: string, sessionStartTime: Date): Promise<RealityCheck> {
    const timeSpentMs = Date.now() - sessionStartTime.getTime();
    const timeSpentMinutes = Math.floor(timeSpentMs / (60 * 1000));

    // Get financial activity since session start
    const deposits = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        createdAt: { gte: sessionStartTime },
      },
      _sum: { amountCents: true },
    });

    const winnings = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'WINNING',
        status: 'COMPLETED',
        createdAt: { gte: sessionStartTime },
      },
      _sum: { amountCents: true },
    });

    const entryFees = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'ENTRY_FEE',
        status: 'COMPLETED',
        createdAt: { gte: sessionStartTime },
      },
      _sum: { amountCents: true },
    });

    const moneyDepositedCents = deposits._sum.amountCents || 0;
    const moneyWonCents = winnings._sum.amountCents || 0;
    const moneyLostCents = entryFees._sum.amountCents || 0;
    const netChangeCents = moneyWonCents - moneyLostCents;

    return {
      timeSpentMinutes,
      moneyDepositedCents,
      moneyWonCents,
      moneyLostCents,
      netChangeCents,
    };
  }

  /**
   * Check if user needs a cooling-off period (after losses)
   */
  async checkCoolingOffRequired(userId: string): Promise<boolean> {
    // Check recent match results
    const recentMatches = await this.prisma.matchPlayer.findMany({
      where: {
        userId,
        match: {
          status: 'FINISHED',
          completedAt: {
            gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
          },
        },
      },
      orderBy: { match: { completedAt: 'desc' } },
      take: 5,
      include: { match: true },
    });

    // Check for loss streak
    let lossStreak = 0;
    for (const mp of recentMatches) {
      if (mp.isWinner) break;
      lossStreak++;
    }

    // Require cooling off after 5 consecutive losses
    if (lossStreak >= 5) {
      return true;
    }

    // Check for significant loss amount
    const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentLosses = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'ENTRY_FEE',
        status: 'COMPLETED',
        createdAt: { gte: hourAgo },
      },
      _sum: { amountCents: true },
    });

    const recentWinnings = await this.prisma.transaction.aggregate({
      where: {
        userId,
        type: 'WINNING',
        status: 'COMPLETED',
        createdAt: { gte: hourAgo },
      },
      _sum: { amountCents: true },
    });

    const netLoss =
      (recentLosses._sum.amountCents || 0) - (recentWinnings._sum.amountCents || 0);

    // Require cooling off after losing $100 in an hour
    if (netLoss >= 100_00) {
      return true;
    }

    return false;
  }

  /**
   * Enforce cooling-off period if required
   */
  async enforceCoolingOff(userId: string): Promise<void> {
    const needsCoolingOff = await this.checkCoolingOffRequired(userId);

    if (needsCoolingOff) {
      throw new ForbiddenException(
        'You have experienced significant losses recently. Please take a 24-hour break. This is for your protection.',
      );
    }
  }
}
