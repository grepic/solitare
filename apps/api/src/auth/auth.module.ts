import { Logger, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>('NODE_ENV') ?? 'development';
        const jwtSecret = config.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          if (nodeEnv === 'production') {
            throw new Error('JWT_SECRET is required in production');
          }

          Logger.warn(
            'JWT_SECRET is not set; using an insecure development fallback secret',
            AuthModule.name,
          );
        }

        return {
          secret: jwtSecret ?? 'dev-jwt-secret-change-me',
        signOptions: {
          expiresIn: config.get('JWT_ACCESS_EXPIRY') || '15m',
        },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, GoogleStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
