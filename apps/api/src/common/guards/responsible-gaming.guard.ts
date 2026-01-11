import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResponsibleGamingService } from '../../users/responsible-gaming.service';

/**
 * Guard to enforce responsible gaming limits and self-exclusion
 *
 * Checks:
 * - Self-exclusion status
 * - Cooling-off period requirements
 * - Deposit/loss limits (if amount specified)
 *
 * Usage:
 * @UseGuards(JwtAuthGuard, ResponsibleGamingGuard)
 * @CheckAmount() // Optional: if endpoint involves money
 */
@Injectable()
export class ResponsibleGamingGuard implements CanActivate {
  constructor(
    private readonly responsibleGamingService: ResponsibleGamingService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (!userId) {
      throw new ForbiddenException('Authentication required');
    }

    // Check self-exclusion
    await this.responsibleGamingService.enforceSelfExclusion(userId);

    // Check cooling-off period
    await this.responsibleGamingService.enforceCoolingOff(userId);

    // If this is a financial transaction, check limits
    const checkAmount = this.reflector.get<boolean>('checkAmount', context.getHandler());
    if (checkAmount && request.body?.amount) {
      const amountCents = parseInt(request.body.amount, 10);

      // For deposits
      if (request.url.includes('/deposit') || request.url.includes('/wallet/add')) {
        await this.responsibleGamingService.checkDepositLimit(userId, amountCents);
      }

      // For match entry
      if (request.url.includes('/queue/join') || request.url.includes('/match')) {
        await this.responsibleGamingService.checkLossLimit(userId, amountCents);
      }
    }

    return true;
  }
}

/**
 * Decorator to mark endpoint as requiring amount check
 */
export const CheckAmount = () => {
  return (target: any, key: string, descriptor: PropertyDescriptor) => {
    Reflect.defineMetadata('checkAmount', true, descriptor.value);
    return descriptor;
  };
};
