export enum Currency {
  USD = 'USD',
}

export enum TransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  ENTRY_FEE = 'ENTRY_FEE',
  WINNING = 'WINNING',
  REFUND = 'REFUND',
  BONUS = 'BONUS',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

export interface Wallet {
  userId: string;
  balanceCents: number;
  currency: Currency;
  lockedCents: number;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amountCents: number;
  currency: Currency;
  status: TransactionStatus;
  providerRef: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  amountCents: number;
  status: TransactionStatus;
  payoutMethod: string;
  payoutDetails: Record<string, any>;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}
