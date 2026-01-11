import { Controller, Get, Post, Body, Query, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ComplianceAuditService } from '../common/services/compliance-audit.service';
import { GeoLocationService } from '../common/services/geo-location.service';
import { ResponsibleGamingService } from '../users/responsible-gaming.service';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Compliance and monitoring endpoints for administrators
 *
 * Required for:
 * - Regulatory reporting
 * - FinCEN compliance
 * - Fraud detection
 * - Age verification management
 */
@Controller('admin/compliance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN' as any)
export class ComplianceController {
  constructor(
    private readonly auditService: ComplianceAuditService,
    private readonly geoService: GeoLocationService,
    private readonly rgService: ResponsibleGamingService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get compliance dashboard overview
   */
  @Get('dashboard')
  async getDashboard() {
    const now = new Date();
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      pendingAgeVerifications,
      pendingWithdrawals,
      highValueTransactions,
      suspiciousActivities,
      selfExclusionCount,
      recentAuditLogs,
    ] = await Promise.all([
      this.prisma.ageVerificationRequest.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.withdrawalRequest.count({
        where: { status: 'PENDING' },
      }),
      this.auditService.getHighValueTransactions(1000_00), // $10k+
      this.auditService.getSuspiciousPatterns(),
      this.prisma.userProfile.count({
        where: { selfExclusionActive: true },
      }),
      this.prisma.auditLog.count({
        where: { createdAt: { gte: monthAgo } },
      }),
    ]);

    return {
      alerts: {
        pendingAgeVerifications,
        pendingWithdrawals,
        highValueTransactionsCount: highValueTransactions.length,
        suspiciousActivitiesCount: suspiciousActivities.length,
      },
      metrics: {
        selfExcludedUsers: selfExclusionCount,
        auditLogsLastMonth: recentAuditLogs,
      },
      recentHighValueTransactions: highValueTransactions.slice(0, 10),
      recentSuspiciousActivities: suspiciousActivities.slice(0, 10),
    };
  }

  /**
   * Generate compliance report for date range
   */
  @Get('report')
  async getComplianceReport(
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ) {
    const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    return this.auditService.generateComplianceReport(startDate, endDate);
  }

  /**
   * Get user audit trail (for compliance/investigation)
   */
  @Get('user/:userId/audit')
  async getUserAudit(
    @Param('userId') userId: string,
    @Query('fromDate') fromDateStr?: string,
    @Query('toDate') toDateStr?: string,
  ) {
    const fromDate = fromDateStr ? new Date(fromDateStr) : undefined;
    const toDate = toDateStr ? new Date(toDateStr) : undefined;

    return this.auditService.getUserAuditTrail(userId, fromDate, toDate);
  }

  /**
   * Get all self-excluded users
   */
  @Get('self-exclusions')
  async getSelfExclusions(@Query('active') activeOnly?: string) {
    const where = activeOnly === 'true'
      ? { selfExclusionActive: true }
      : {};

    return this.prisma.userProfile.findMany({
      where,
      select: {
        userId: true,
        selfExclusionActive: true,
        selfExclusionStart: true,
        selfExclusionEnd: true,
        selfExclusionReason: true,
        user: {
          select: {
            email: true,
            nickname: true,
          },
        },
      },
      orderBy: { selfExclusionStart: 'desc' },
    });
  }

  /**
   * Get users with responsible gaming limits set
   */
  @Get('limits')
  async getUsersWithLimits() {
    return this.prisma.userProfile.findMany({
      where: {
        OR: [
          { depositLimitDaily: { not: null } },
          { depositLimitWeekly: { not: null } },
          { depositLimitMonthly: { not: null } },
          { lossLimitDaily: { not: null } },
          { lossLimitWeekly: { not: null } },
          { lossLimitMonthly: { not: null } },
        ],
      },
      select: {
        userId: true,
        depositLimitDaily: true,
        depositLimitWeekly: true,
        depositLimitMonthly: true,
        lossLimitDaily: true,
        lossLimitWeekly: true,
        lossLimitMonthly: true,
        limitsUpdatedAt: true,
        user: {
          select: {
            email: true,
            nickname: true,
          },
        },
      },
    });
  }

  /**
   * Get high-value transactions (for CTR reporting to FinCEN)
   * Currency Transaction Report required for $10k+
   */
  @Get('high-value-transactions')
  async getHighValueTransactions(@Query('threshold') thresholdStr?: string) {
    const thresholdCents = thresholdStr ? parseInt(thresholdStr, 10) : 1000_00;
    return this.auditService.getHighValueTransactions(thresholdCents);
  }

  /**
   * Get suspicious activity patterns (for SAR reporting)
   * Suspicious Activity Report required for potential fraud/money laundering
   */
  @Get('suspicious-activity')
  async getSuspiciousActivity() {
    return this.auditService.getSuspiciousPatterns();
  }

  /**
   * Flag suspicious activity manually
   */
  @Post('flag-suspicious')
  async flagSuspicious(
    @Req() req,
    @Body() dto: {
      userId: string;
      activityType: string;
      details: any;
      notes: string;
    },
  ) {
    await this.auditService.logSuspiciousActivity(
      dto.userId,
      dto.activityType,
      { ...dto.details, adminNotes: dto.notes },
      req.ip,
    );

    return { success: true, message: 'Activity flagged for review' };
  }

  /**
   * Get geographic distribution of users
   * Useful for compliance with state regulations
   */
  @Get('geo-distribution')
  async getGeoDistribution() {
    const users = await this.prisma.userProfile.groupBy({
      by: ['country', 'state'],
      _count: true,
      orderBy: {
        _count: {
          userId: 'desc',
        },
      },
    });

    return users.map((u) => ({
      country: u.country,
      state: u.state,
      count: u._count,
    }));
  }

  /**
   * Check user's current location for compliance
   */
  @Post('check-location')
  async checkUserLocation(@Body() dto: { userId: string; ipAddress: string }) {
    const location = this.geoService.lookup(dto.ipAddress);

    // Log the check
    await this.auditService.log({
      userId: dto.userId,
      action: 'LOCATION_CHECK',
      entity: 'User',
      entityId: dto.userId,
      changes: { location },
      ipAddress: dto.ipAddress,
      geoLocation: location,
    });

    return {
      location,
      isPermitted: location ? !location.isBlocked : false,
      minimumAge: this.geoService.getMinimumAge(location?.region || null),
    };
  }

  /**
   * Get users who may be violating geo-restrictions
   */
  @Get('geo-violations')
  async getGeoViolations() {
    // Find users with recent activity from blocked locations
    // This would require tracking IP addresses in transactions
    // Simplified version here

    const recentLogs = await this.prisma.auditLog.findMany({
      where: {
        action: { in: ['MATCH_ENTRY', 'DEPOSIT', 'WITHDRAWAL_REQUESTED'] },
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
      select: {
        userId: true,
        ipAddress: true,
        metadata: true,
        createdAt: true,
      },
    });

    const violations = recentLogs.filter((log) => {
      if (!log.ipAddress) return false;
      const location = this.geoService.lookup(log.ipAddress);
      return location?.isBlocked || false;
    });

    return violations;
  }

  /**
   * Get transaction velocity (for fraud detection)
   * Rapid transactions may indicate fraud or account takeover
   */
  @Get('transaction-velocity')
  async getTransactionVelocity(@Query('hours') hoursStr?: string) {
    const hours = hoursStr ? parseInt(hoursStr, 10) : 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const transactions = await this.prisma.transaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: since },
        status: 'COMPLETED',
      },
      _count: true,
      _sum: { amountCents: true },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 50,
    });

    const flagged = transactions.filter((t) => t._count > 10); // More than 10 transactions in time window

    return {
      timeWindow: `${hours} hours`,
      totalUsers: transactions.length,
      flaggedUsers: flagged.length,
      details: flagged.map((t) => ({
        userId: t.userId,
        transactionCount: t._count,
        totalAmountDollars: ((t._sum.amountCents || 0) / 100).toFixed(2),
      })),
    };
  }
}
