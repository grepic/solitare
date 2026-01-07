import { z } from 'zod';

export const RegisterDto = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  nickname: z.string().min(3).max(20),
  country: z.string().length(2),
  state: z.string().max(3).optional(),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type RegisterDto = z.infer<typeof RegisterDto>;

export const LoginDto = z.object({
  email: z.string().email(),
  password: z.string(),
});

export type LoginDto = z.infer<typeof LoginDto>;

export const OAuthAppleDto = z.object({
  identityToken: z.string(),
  authorizationCode: z.string(),
  user: z
    .object({
      email: z.string().email().optional(),
      name: z
        .object({
          firstName: z.string().optional(),
          lastName: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});

export type OAuthAppleDto = z.infer<typeof OAuthAppleDto>;

export const OAuthGoogleDto = z.object({
  idToken: z.string(),
});

export type OAuthGoogleDto = z.infer<typeof OAuthGoogleDto>;

export const RefreshTokenDto = z.object({
  refreshToken: z.string(),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenDto>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    nickname: string;
    avatarUrl: string | null;
    role: string;
  };
  tokens: AuthTokens;
}
