import { Injectable, ForbiddenException } from '@nestjs/common';
import * as geoip from 'geoip-lite';

// States where real-money skill gaming is prohibited
export const BLOCKED_STATES = [
  'AZ', // Arizona
  'IA', // Iowa
  'LA', // Louisiana
  'MT', // Montana
  'WA', // Washington
];

// Countries under OFAC sanctions or where operation is prohibited
export const BLOCKED_COUNTRIES = [
  'KP', // North Korea
  'IR', // Iran
  'SY', // Syria
  'CU', // Cuba
  // Add more as needed based on legal advice
];

export interface GeoLocation {
  country: string;
  region: string; // State/province code
  city: string;
  ll: [number, number]; // Latitude, longitude
  isBlocked: boolean;
  blockReason?: string;
}

@Injectable()
export class GeoLocationService {
  /**
   * Look up geographic location from IP address
   */
  lookup(ipAddress: string): GeoLocation | null {
    // Remove IPv6 prefix if present
    const cleanIp = ipAddress.replace(/^::ffff:/, '');

    const geo = geoip.lookup(cleanIp);

    if (!geo) {
      return null;
    }

    const isBlockedCountry = BLOCKED_COUNTRIES.includes(geo.country);
    const isBlockedState = geo.region && BLOCKED_STATES.includes(geo.region);

    return {
      country: geo.country,
      region: geo.region,
      city: geo.city,
      ll: geo.ll,
      isBlocked: isBlockedCountry || isBlockedState,
      blockReason: isBlockedCountry
        ? `Service not available in ${geo.country}`
        : isBlockedState
        ? `Service not available in ${geo.region}`
        : undefined,
    };
  }

  /**
   * Verify user location is permitted for real-money gaming
   * Throws ForbiddenException if blocked
   */
  verifyLocation(ipAddress: string): GeoLocation {
    const location = this.lookup(ipAddress);

    if (!location) {
      throw new ForbiddenException(
        'Unable to verify your location. Please check your network connection.',
      );
    }

    if (location.isBlocked) {
      throw new ForbiddenException(location.blockReason);
    }

    return location;
  }

  /**
   * Check if location is within permitted jurisdictions
   */
  isLocationPermitted(ipAddress: string): boolean {
    const location = this.lookup(ipAddress);
    return location ? !location.isBlocked : false;
  }

  /**
   * Get user's state/region code (for age requirement checks)
   */
  getRegion(ipAddress: string): string | null {
    const location = this.lookup(ipAddress);
    return location?.region || null;
  }

  /**
   * States requiring 21+ age verification
   * Most states: 18+, but these require 21+
   */
  getMinimumAge(region: string | null): number {
    const STATES_REQUIRING_21 = [
      'AL', 'AZ', 'AR', 'IA', 'LA', 'MA', 'MI', 'MS', 'NV', 'NJ', 'NY', 'PA',
    ];

    if (!region) return 21; // Default to stricter requirement

    return STATES_REQUIRING_21.includes(region) ? 21 : 18;
  }
}
