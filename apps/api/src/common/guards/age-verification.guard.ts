import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoLocationService } from '../services/geo-location.service';

/**
 * Guard to enforce age verification requirements before real-money transactions
 *
 * Requirements vary by state:
 * - Most states: 18+
 * - Some states: 21+ (AL, AZ, AR, IA, LA, MA, MI, MS, NV, NJ, NY, PA)
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, AgeVerificationGuard)
 */
@Injectable()
export class AgeVerificationGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoLocationService: GeoLocationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    // Get user with age verification status
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        ageVerified: true,
        ageVerificationStatus: true,
        dateOfBirth: true,
        country: true,
      },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Check if age verification is approved
    if (user.ageVerificationStatus !== 'APPROVED') {
      throw new ForbiddenException(
        'Age verification required. Please submit your identification documents in Settings.',
      );
    }

    // Determine minimum age based on user's location
    const ipAddress =
      request.headers['x-forwarded-for']?.split(',')[0].trim() ||
      request.ip ||
      request.connection.remoteAddress;

    const region = this.geoLocationService.getRegion(ipAddress);
    const minimumAge = this.geoLocationService.getMinimumAge(region);

    // Calculate user's age
    if (!user.dateOfBirth) {
      throw new ForbiddenException('Date of birth not on file. Please update your profile.');
    }

    const age = this.calculateAge(user.dateOfBirth);

    if (age < minimumAge) {
      throw new ForbiddenException(
        `You must be at least ${minimumAge} years old to use this service in your location.`,
      );
    }

    // Check if verification is recent enough (re-verify annually)
    // This would require adding ageVerifiedAt timestamp to User model
    // For now, we just check that it's verified

    return true;
  }

  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }
}
