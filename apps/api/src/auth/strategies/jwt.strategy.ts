import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private authService: AuthService,
  ) {
    const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
    const jwtSecret = config.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      if (nodeEnv === 'production') {
        throw new Error('JWT_SECRET is required in production');
      }
      Logger.warn(
        'JWT_SECRET is not set; using an insecure development fallback secret',
        JwtStrategy.name,
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret ?? 'dev-jwt-secret-change-me',
    });
  }

  async validate(payload: { sub: string }) {
    const user = await this.authService.validateUser(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException();
    }

    return user;
  }
}
