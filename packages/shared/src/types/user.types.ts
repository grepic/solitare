export enum OAuthProvider {
  APPLE = 'APPLE',
  GOOGLE = 'GOOGLE',
  EMAIL = 'EMAIL',
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export interface User {
  id: string;
  email: string;
  oauthProvider: OAuthProvider;
  oauthId: string | null;
  nickname: string;
  avatarUrl: string | null;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  userId: string;
  country: string | null;
  state: string | null;
  dateOfBirth: Date | null;
  ageVerified: boolean;
  xp: number;
  level: number;
  totalMatches: number;
  wins: number;
  losses: number;
  winRate: number;
}
