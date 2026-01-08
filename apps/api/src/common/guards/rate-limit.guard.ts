import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const ip = request.ip || request.connection.remoteAddress;

    const key = userId || ip;
    const action = `${request.method}:${request.path}`;

    const limit = this.getLimit(action);
    const window = 60; // 1 minute window

    const count = await this.incrementCounter(key, action, window);

    if (count > limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests, please try again later',
          retryAfter: window,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getLimit(action: string): number {
    // Different limits for different actions
    if (action.includes('/auth/login')) return 5;
    if (action.includes('/auth/register')) return 3;
    if (action.includes('/wallet/deposit')) return 10;
    if (action.includes('/wallet/withdraw')) return 5;

    return 60; // Default: 60 requests per minute
  }

  private async incrementCounter(key: string, action: string, windowSeconds: number): Promise<number> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Clean old entries
    await this.prisma.rateLimitEntry.deleteMany({
      where: {
        timestamp: { lt: new Date(windowStart) },
      },
    });

    // Count recent requests
    const count = await this.prisma.rateLimitEntry.count({
      where: {
        key,
        action,
        timestamp: { gte: new Date(windowStart) },
      },
    });

    // Record this request
    await this.prisma.rateLimitEntry.create({
      data: {
        key,
        action,
        timestamp: new Date(),
      },
    });

    return count + 1;
  }
}
