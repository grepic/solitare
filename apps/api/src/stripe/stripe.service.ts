import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { WalletService } from '../wallet/wallet.service';
import { TransactionType, TransactionStatus } from '@prisma/client';
import { WALLET_LIMITS } from '@solitaire/shared';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private walletService: WalletService,
  ) {
    this.stripe = new Stripe(this.config.get('STRIPE_SECRET_KEY')!, {
      apiVersion: '2024-12-18.acacia',
    });
  }

  async createDepositIntent(userId: string, amountCents: number) {
    if (amountCents < WALLET_LIMITS.MIN_DEPOSIT_CENTS) {
      throw new BadRequestException(
        `Minimum deposit is $${WALLET_LIMITS.MIN_DEPOSIT_CENTS / 100}`,
      );
    }

    if (amountCents > WALLET_LIMITS.MAX_DEPOSIT_CENTS) {
      throw new BadRequestException(
        `Maximum deposit is $${WALLET_LIMITS.MAX_DEPOSIT_CENTS / 100}`,
      );
    }

    // Create pending transaction
    const transaction = await this.walletService.createPendingTransaction(
      userId,
      TransactionType.DEPOSIT,
      amountCents,
    );

    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amountCents,
      currency: 'usd',
      metadata: {
        userId,
        transactionId: transaction.id,
      },
    });

    // Update transaction with Stripe reference
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { providerRef: paymentIntent.id },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amountCents,
    };
  }

  async handleWebhook(signature: string, rawBody: Buffer) {
    const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;

    try {
      // Verify webhook signature - this prevents unauthorized requests
      event = this.stripe.webhooks.constructEvent(rawBody, signature, webhookSecret!);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    // Prevent replay attacks - reject events older than 5 minutes
    const eventAge = Date.now() / 1000 - event.created;
    if (eventAge > 300) {
      console.warn(`Rejected old webhook event ${event.id}, age: ${eventAge}s`);
      throw new BadRequestException('Webhook event too old');
    }

    // Idempotency check - prevent processing the same event twice
    const existingEvent = await this.prisma.stripeWebhookEvent.findUnique({
      where: { eventId: event.id },
    });

    if (existingEvent) {
      console.log(`Event ${event.id} already processed, skipping`);
      return { received: true, processed: false };
    }

    // Record event for idempotency
    await this.prisma.stripeWebhookEvent.create({
      data: {
        eventId: event.id,
        eventType: event.type,
        processedAt: new Date(),
      },
    });

    console.log(`Processing webhook event ${event.id} (${event.type})`);

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;

        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(`Failed to process webhook event ${event.id}:`, error);
      // Don't throw - Stripe will retry if we return non-2xx
      // Log the error for manual investigation
    }

    return { received: true, processed: true };
  }

  async createWithdrawalRequest(
    userId: string,
    amountCents: number,
    payoutMethod: string,
    payoutDetails: any,
  ) {
    if (amountCents < WALLET_LIMITS.MIN_WITHDRAWAL_CENTS) {
      throw new BadRequestException(
        `Minimum withdrawal is $${WALLET_LIMITS.MIN_WITHDRAWAL_CENTS / 100}`,
      );
    }

    // Check balance
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet || wallet.balanceCents < amountCents) {
      throw new BadRequestException('Insufficient balance');
    }

    // Create withdrawal request
    const request = await this.prisma.withdrawalRequest.create({
      data: {
        userId,
        amountCents,
        payoutMethod,
        payoutDetails,
        status: TransactionStatus.PENDING,
      },
    });

    // Lock funds
    await this.walletService.lockFunds(userId, amountCents, {
      withdrawalRequestId: request.id,
    });

    return request;
  }

  async approveWithdrawal(requestId: string, adminId: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Withdrawal request not found');
    }

    if (request.status !== TransactionStatus.PENDING) {
      throw new BadRequestException('Request already processed');
    }

    // Update request
    await this.prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: TransactionStatus.COMPLETED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Process withdrawal
    await this.walletService.deductFunds(
      request.userId,
      request.amountCents,
      TransactionType.WITHDRAWAL,
      { withdrawalRequestId: requestId },
    );

    // In production, trigger actual payout via Stripe Connect or other method
    // For now, we just mark it as completed

    return { success: true };
  }

  async rejectWithdrawal(requestId: string, adminId: string, reason: string) {
    const request = await this.prisma.withdrawalRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new BadRequestException('Withdrawal request not found');
    }

    await this.prisma.withdrawalRequest.update({
      where: { id: requestId },
      data: {
        status: TransactionStatus.CANCELLED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        reviewNotes: reason,
      },
    });

    // Unlock funds
    await this.walletService.unlockFunds(request.userId, request.amountCents);

    return { success: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const userId = paymentIntent.metadata.userId;
    const transactionId = paymentIntent.metadata.transactionId;

    if (!userId || !transactionId) {
      console.error('Missing metadata in payment intent');
      return;
    }

    // Add funds to wallet
    await this.walletService.addFunds(
      userId,
      paymentIntent.amount,
      TransactionType.DEPOSIT,
      paymentIntent.id,
      { paymentIntentId: paymentIntent.id },
    );

    // Update transaction status
    await this.walletService.updateTransactionStatus(transactionId, TransactionStatus.COMPLETED);
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    const transactionId = paymentIntent.metadata.transactionId;

    if (transactionId) {
      await this.walletService.updateTransactionStatus(transactionId, TransactionStatus.FAILED);
    }
  }
}
