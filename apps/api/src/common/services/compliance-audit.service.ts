import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogEntry {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
  geoLocation?: any;
}

/**
 * Service for compliance audit logging
 *
 * Required for:
 * - FinCEN compliance (record keeping)
 * - State regulations (audit trail)
 * - Fraud detection
 * - Dispute resolution
 *
 * Retention: Minimum 5 years (7 years recommended)
 */
@Injectable()
export class ComplianceAuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Log a compliance-relevant action
   */
  async log(entry: AuditLogEntry): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        changes: entry.changes || {},
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: {
          geoLocation: entry.geoLocation,
        },
      },
    });
  }

  /**
   * Log user registration
   */
  async logRegistration(
    userId: string,
    email: string,
    ipAddress: string,
    geoLocation: any,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'USER_REGISTERED',
      entity: 'User',
      entityId: userId,
      changes: { email },
      ipAddress,
      geoLocation,
    });
  }

  /**
   * Log age verification attempt
   */
  async logAgeVerification(
    userId: string,
    documentType: string,
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED',
    ipAddress: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: `AGE_VERIFICATION_${status}`,
      entity: 'AgeVerificationRequest',
      entityId: userId,
      changes: { documentType, status },
      ipAddress,
    });
  }

  /**
   * Log deposit transaction
   */
  async logDeposit(
    userId: string,
    transactionId: string,
    amountCents: number,
    paymentMethod: string,
    ipAddress: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'DEPOSIT',
      entity: 'Transaction',
      entityId: transactionId,
      changes: {
        amountCents,
        paymentMethod,
      },
      ipAddress,
    });
  }

  /**
   * Log withdrawal request
   */
  async logWithdrawal(
    userId: string,
    withdrawalId: string,
    amountCents: number,
    method: string,
    ipAddress: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'WITHDRAWAL_REQUESTED',
      entity: 'WithdrawalRequest',
      entityId: withdrawalId,
      changes: {
        amountCents,
        method,
      },
      ipAddress,
    });
  }

  /**
   * Log match entry (real money)
   */
  async logMatchEntry(
    userId: string,
    matchId: string,
    tier: string,
    entryFeeCents: number,
    ipAddress: string,
    geoLocation: any,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'MATCH_ENTRY',
      entity: 'Match',
      entityId: matchId,
      changes: {
        tier,
        entryFeeCents,
      },
      ipAddress,
      geoLocation,
    });
  }

  /**
   * Log self-exclusion activation
   */
  async logSelfExclusion(
    userId: string,
    duration: string,
    reason: string | undefined,
    ipAddress: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'SELF_EXCLUSION_ACTIVATED',
      entity: 'User',
      entityId: userId,
      changes: {
        duration,
        reason,
      },
      ipAddress,
    });
  }

  /**
   * Log responsible gaming limit changes
   */
  async logLimitChange(
    userId: string,
    limitType: 'DEPOSIT' | 'LOSS' | 'SESSION',
    oldValues: any,
    newValues: any,
    ipAddress: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: `${limitType}_LIMIT_CHANGED`,
      entity: 'UserProfile',
      entityId: userId,
      changes: {
        old: oldValues,
        new: newValues,
      },
      ipAddress,
    });
  }

  /**
   * Log account ban/suspension
   */
  async logAccountAction(
    adminUserId: string,
    targetUserId: string,
    action: 'BAN' | 'UNBAN' | 'SUSPEND',
    reason: string,
    duration?: number,
  ): Promise<void> {
    await this.log({
      userId: adminUserId,
      action: `ACCOUNT_${action}`,
      entity: 'User',
      entityId: targetUserId,
      changes: {
        reason,
        duration,
        targetUser: targetUserId,
      },
    });
  }

  /**
   * Log suspicious activity detection
   */
  async logSuspiciousActivity(
    userId: string,
    activityType: string,
    details: any,
    ipAddress: string,
  ): Promise<void> {
    await this.log({
      userId,
      action: 'SUSPICIOUS_ACTIVITY_DETECTED',
      entity: 'User',
      entityId: userId,
      changes: {
        type: activityType,
        details,
      },
      ipAddress,
    });
  }

  /**
   * Get audit trail for user (for compliance requests)
   */
  async getUserAuditTrail(userId: string, fromDate?: Date, toDate?: Date) {
    return this.prisma.auditLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get high-value transactions (for reporting)
   * Transactions over $10,000 must be reported to FinCEN (CTR)
   */
  async getHighValueTransactions(thresholdCents: number = 1000_00) {
    return this.prisma.transaction.findMany({
      where: {
        amountCents: { gte: thresholdCents },
        type: 'DEPOSIT',
        status: 'COMPLETED',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            profile: {
              select: {
                country: true,
                state: true,
                dateOfBirth: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get suspicious patterns for SAR (Suspicious Activity Report)
   */
  async getSuspiciousPatterns() {
    // Multiple rapid deposits/withdrawals
    // Unusual geographic patterns
    // Structuring (multiple transactions just under reporting threshold)
    // This is a simplified example - real implementation would be more sophisticated

    const suspiciousActivities = await this.prisma.auditLog.findMany({
      where: {
        action: { contains: 'SUSPICIOUS' },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
      },
    });

    return suspiciousActivities;
  }

  /**
   * Generate compliance report for regulators
   */
  async generateComplianceReport(startDate: Date, endDate: Date) {
    const [
      totalUsers,
      totalTransactions,
      totalVolumeCents,
      ageVerifications,
      selfExclusions,
      highValueTxns,
      suspiciousActivity,
    ] = await Promise.all([
      this.prisma.user.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.transaction.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
      }),
      this.prisma.transaction.aggregate({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
          type: { in: ['DEPOSIT', 'WINNING'] },
        },
        _sum: { amountCents: true },
      }),
      this.prisma.auditLog.count({
        where: {
          action: { contains: 'AGE_VERIFICATION' },
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          action: 'SELF_EXCLUSION_ACTIVATED',
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      this.getHighValueTransactions(),
      this.getSuspiciousPatterns(),
    ]);

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      metrics: {
        totalUsers,
        totalTransactions,
        totalVolumeDollars: (totalVolumeCents._sum.amountCents || 0) / 100,
        ageVerifications,
        selfExclusions,
      },
      compliance: {
        highValueTransactionsCount: highValueTxns.length,
        suspiciousActivitiesCount: suspiciousActivity.length,
      },
      details: {
        highValueTransactions: highValueTxns,
        suspiciousActivities: suspiciousActivity,
      },
    };
  }
}
