// Augment @prisma/client module with enum types
// This works around Prisma engine download restrictions

declare module '@prisma/client' {
  export enum OAuthProvider {
    APPLE = 'APPLE',
    GOOGLE = 'GOOGLE',
    EMAIL = 'EMAIL',
  }

  export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
  }

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

  export enum MatchStatus {
    CREATING = 'CREATING',
    READY_CHECK = 'READY_CHECK',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
    CANCELLED = 'CANCELLED',
    DISPUTED = 'DISPUTED',
  }

  export enum GameStatus {
    WAITING = 'WAITING',
    READY_CHECK = 'READY_CHECK',
    IN_PROGRESS = 'IN_PROGRESS',
    FINISHED = 'FINISHED',
    CANCELLED = 'CANCELLED',
  }

  export enum MatchTier {
    PRACTICE = 'PRACTICE',
    TIER_1 = 'TIER_1',
    TIER_5 = 'TIER_5',
    TIER_10 = 'TIER_10',
    TIER_25 = 'TIER_25',
  }

  export enum AgeVerificationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
  }
}
