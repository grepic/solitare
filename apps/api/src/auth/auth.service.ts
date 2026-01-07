import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { nanoid } from 'nanoid';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto, OAuthGoogleDto, AuthResponse, AuthTokens } from '@solitaire/shared';
import { OAuthProvider, UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Check age verification
    const age = this.calculateAge(new Date(dto.dateOfBirth));
    if (age < 18) {
      throw new BadRequestException('Must be 18 or older to register');
    }

    // Check if email exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Check geo restrictions
    await this.checkGeoRestrictions(dto.country, dto.state);

    // Hash password
    const passwordHash = await argon2.hash(dto.password, {
      memoryCost: Number(this.config.get('ARGON2_MEMORY_COST')) || 65536,
      timeCost: Number(this.config.get('ARGON2_TIME_COST')) || 3,
      parallelism: Number(this.config.get('ARGON2_PARALLELISM')) || 4,
    });

    // Create user with profile and wallet
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        nickname: dto.nickname,
        oauthProvider: OAuthProvider.EMAIL,
        role: UserRole.USER,
        profile: {
          create: {
            country: dto.country,
            state: dto.state,
            dateOfBirth: new Date(dto.dateOfBirth),
            ageVerified: true,
          },
        },
        wallet: {
          create: {
            balanceCents: 0,
            lockedCents: 0,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    const tokens = await this.generateTokens(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        role: user.role,
      },
      tokens,
    };
  }

  async oauthGoogle(dto: OAuthGoogleDto): Promise<AuthResponse> {
    // In production, verify idToken with Google
    // For now, we'll simulate it
    throw new Error('Google OAuth not yet implemented - requires Google API verification');
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.isRevoked || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Revoke old token
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { isRevoked: true },
    });

    return this.generateTokens(tokenRecord.userId);
  }

  async logout(userId: string, refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        token: refreshToken,
      },
      data: {
        isRevoked: true,
      },
    });
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
  }

  private async generateTokens(userId: string): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign(
      { sub: userId },
      { expiresIn: this.config.get('JWT_ACCESS_EXPIRY') || '15m' },
    );

    const refreshToken = nanoid(64);
    const refreshExpiry = this.config.get('JWT_REFRESH_EXPIRY') || '7d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
    };
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  private async checkGeoRestrictions(country: string, state?: string): Promise<void> {
    const restriction = await this.prisma.restrictedRegion.findFirst({
      where: {
        isActive: true,
        countryCode: country,
        OR: [{ stateCode: null }, { stateCode: state || null }],
      },
    });

    if (restriction) {
      throw new BadRequestException('Registration not available in your region');
    }
  }
}
