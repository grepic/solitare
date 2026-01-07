import { z } from 'zod';

export const UpdateProfileDto = z.object({
  nickname: z.string().min(3).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  country: z.string().length(2).optional(),
  state: z.string().max(3).optional(),
});

export type UpdateProfileDto = z.infer<typeof UpdateProfileDto>;

export interface UserProfileResponse {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
  country: string | null;
  state: string | null;
  ageVerified: boolean;
  level: number;
  xp: number;
  stats: {
    totalMatches: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  createdAt: string;
}
