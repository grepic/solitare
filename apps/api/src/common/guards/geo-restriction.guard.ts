import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GeoLocationService } from '../services/geo-location.service';

/**
 * Guard to enforce geographic restrictions on real-money endpoints
 *
 * Usage:
 * @UseGuards(GeoRestrictionGuard)
 * @RequireGeoCheck() // Optional: can specify custom message
 */
@Injectable()
export class GeoRestrictionGuard implements CanActivate {
  constructor(
    private readonly geoLocationService: GeoLocationService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Get client IP address
    const ipAddress =
      request.headers['x-forwarded-for']?.split(',')[0].trim() ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.ip;

    if (!ipAddress) {
      throw new ForbiddenException('Unable to determine your location');
    }

    // Verify location is permitted
    try {
      const location = this.geoLocationService.verifyLocation(ipAddress);

      // Attach location to request for later use
      request.geoLocation = location;

      return true;
    } catch (error) {
      throw error;
    }
  }
}

/**
 * Decorator to require geo-location check
 */
export const RequireGeoCheck = () => {
  return (target: any, key?: string, descriptor?: PropertyDescriptor) => {
    // Marker decorator - actual check is in the guard
    return descriptor;
  };
};
