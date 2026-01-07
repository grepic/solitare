import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { WALLET_LIMITS } from '@solitaire/shared';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }

    return {
      balanceCents: wallet.balanceCents,
      lockedCents: wallet.lockedCents,
      availableCents: wallet.balanceCents - wallet.lockedCents,
      currency: wallet.currency,
    };
  }

  async getTransactions(userId: string, limit = 50, offset = 0) {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return transactions.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amountCents: tx.amountCents,
      status: tx.status,
      createdAt: tx.createdAt.toISOString(),
      metadata: tx.metadata,
    }));
  }

  async lockFunds(userId: string, amountCents: number, metadata?: any): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      const available = wallet.balanceCents - wallet.lockedCents;

      if (available < amountCents) {
        throw new BadRequestException('Insufficient balance');
      }

      await tx.wallet.update({
        where: { userId },
        data: {
          lockedCents: wallet.lockedCents + amountCents,
        },
      });
    });
  }

  async unlockFunds(userId: string, amountCents: number): Promise<void> {
    await this.prisma.wallet.update({
      where: { userId },
      data: {
        lockedCents: {
          decrement: amountCents,
        },
      },
    });
  }

  async deductFunds(
    userId: string,
    amountCents: number,
    type: TransactionType,
    metadata?: any,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({
        where: { userId },
      });

      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      // Deduct from locked funds first, then from balance
      const newLockedCents = Math.max(0, wallet.lockedCents - amountCents);
      const remainingToDeduct = amountCents - (wallet.lockedCents - newLockedCents);

      await tx.wallet.update({
        where: { userId },
        data: {
          balanceCents: wallet.balanceCents - remainingToDeduct,
          lockedCents: newLockedCents,
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type,
          amountCents: -amountCents,
          status: TransactionStatus.COMPLETED,
          metadata,
        },
      });
    });
  }

  async addFunds(
    userId: string,
    amountCents: number,
    type: TransactionType,
    providerRef?: string,
    metadata?: any,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.wallet.update({
        where: { userId },
        data: {
          balanceCents: {
            increment: amountCents,
          },
        },
      });

      await tx.transaction.create({
        data: {
          userId,
          type,
          amountCents,
          status: TransactionStatus.COMPLETED,
          providerRef,
          metadata,
        },
      });
    });
  }

  async createPendingTransaction(
    userId: string,
    type: TransactionType,
    amountCents: number,
    providerRef?: string,
  ) {
    return this.prisma.transaction.create({
      data: {
        userId,
        type,
        amountCents,
        status: TransactionStatus.PENDING,
        providerRef,
      },
    });
  }

  async updateTransactionStatus(transactionId: string, status: TransactionStatus) {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: { status },
    });
  }
}
