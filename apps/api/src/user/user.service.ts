import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from '@solitaire/shared';
import { TransactionStatus } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });

    if (!user || !user.profile) {
      throw new NotFoundException('User not found');
    }

    const winRate = user.profile.totalMatches > 0
      ? (user.profile.wins / user.profile.totalMatches) * 100
      : 0;

    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      country: user.profile.country,
      state: user.profile.state,
      ageVerified: user.profile.ageVerified,
      level: user.profile.level,
      xp: user.profile.xp,
      stats: {
        totalMatches: user.profile.totalMatches,
        wins: user.profile.wins,
        losses: user.profile.losses,
        winRate: Math.round(winRate * 100) / 100,
      },
      createdAt: user.createdAt.toISOString(),
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        nickname: dto.nickname,
        avatarUrl: dto.avatarUrl,
        profile: {
          update: {
            country: dto.country,
            state: dto.state,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    return this.getProfile(user.id);
  }

  async getMatchHistory(userId: string, limit = 20, offset = 0) {
    const matches = await this.prisma.matchPlayer.findMany({
      where: { userId },
      include: {
        match: {
          include: {
            players: {
              include: {
                user: {
                  select: {
                    id: true,
                    nickname: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        match: {
          finishedAt: 'desc',
        },
      },
      take: limit,
      skip: offset,
    });

    return matches.map((mp) => {
      const opponent = mp.match.players.find((p) => p.userId !== userId);

      return {
        matchId: mp.matchId,
        tier: mp.match.tier,
        entryFeeCents: mp.match.entryFeeCents,
        isWinner: mp.isWinner,
        payoutCents: mp.payoutCents,
        finalScore: mp.finalScore,
        finalTimeMs: mp.finalTimeMs,
        opponent: opponent
          ? {
              nickname: opponent.user.nickname,
              avatarUrl: opponent.user.avatarUrl,
            }
          : null,
        playedAt: mp.match.finishedAt?.toISOString(),
      };
    });
  }

  async submitAgeVerification(userId: string, frontImage: string, backImage?: string) {
    // Check if user already has pending verification
    const existingRequest = await this.prisma.ageVerificationRequest.findFirst({
      where: {
        userId,
        status: TransactionStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('You already have a pending verification request');
    }

    // Check if user is already verified
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (user?.profile?.ageVerified) {
      throw new BadRequestException('Your age is already verified');
    }

    // Create verification request
    // In production, upload images to S3 or similar storage
    // For now, we'll store base64 in database (NOT recommended for production)
    const request = await this.prisma.ageVerificationRequest.create({
      data: {
        userId,
        frontImageUrl: frontImage.substring(0, 100), // Truncate for demo - use S3 in production
        backImageUrl: backImage?.substring(0, 100),
        status: TransactionStatus.PENDING,
      },
    });

    return {
      id: request.id,
      status: request.status,
      message: 'Verification request submitted successfully',
    };
  }

  async getVerificationStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        ageVerificationRequests: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const latestRequest = user.ageVerificationRequests[0];

    return {
      ageVerified: user.profile?.ageVerified || false,
      hasPendingRequest: latestRequest?.status === TransactionStatus.PENDING,
      latestRequest: latestRequest
        ? {
            id: latestRequest.id,
            status: latestRequest.status,
            submittedAt: latestRequest.createdAt.toISOString(),
            reviewedAt: latestRequest.reviewedAt?.toISOString(),
            reviewNotes: latestRequest.reviewNotes,
          }
        : null,
    };
  }
}
