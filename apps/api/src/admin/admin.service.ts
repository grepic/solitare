import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getWithdrawalRequests(status?: TransactionStatus) {
    return this.prisma.withdrawalRequest.findMany({
      where: status ? { status } : undefined,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const [userCount, matchCount, totalDeposits, totalWithdrawals] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.match.count(),
      this.prisma.transaction.aggregate({
        where: {
          type: 'DEPOSIT',
          status: 'COMPLETED',
        },
        _sum: {
          amountCents: true,
        },
      }),
      this.prisma.transaction.aggregate({
        where: {
          type: 'WITHDRAWAL',
          status: 'COMPLETED',
        },
        _sum: {
          amountCents: true,
        },
      }),
    ]);

    return {
      users: userCount,
      matches: matchCount,
      totalDepositsCents: totalDeposits._sum.amountCents || 0,
      totalWithdrawalsCents: totalWithdrawals._sum.amountCents || 0,
    };
  }

  async createAuditLog(
    userId: string,
    action: string,
    entity: string,
    entityId: string,
    changes: any,
  ) {
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
}
