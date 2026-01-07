import { z } from 'zod';

export const CreateDepositIntentDto = z.object({
  amountCents: z.number().int().min(100).max(100000), // $1 - $1000
});

export type CreateDepositIntentDto = z.infer<typeof CreateDepositIntentDto>;

export interface DepositIntentResponse {
  clientSecret: string;
  amountCents: number;
}

export const CreateWithdrawalRequestDto = z.object({
  amountCents: z.number().int().min(500), // Minimum $5
  payoutMethod: z.enum(['BANK_TRANSFER', 'PAYPAL', 'STRIPE']),
  payoutDetails: z.record(z.any()),
});

export type CreateWithdrawalRequestDto = z.infer<typeof CreateWithdrawalRequestDto>;

export interface WalletBalanceResponse {
  balanceCents: number;
  lockedCents: number;
  availableCents: number;
  currency: string;
}

export interface TransactionResponse {
  id: string;
  type: string;
  amountCents: number;
  status: string;
  createdAt: string;
  metadata?: Record<string, any>;
}
