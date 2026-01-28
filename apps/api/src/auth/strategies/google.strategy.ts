import { Injectable, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(config: ConfigService) {
    const clientID = config.get<string>('GOOGLE_CLIENT_ID');
    const clientSecret = config.get<string>('GOOGLE_CLIENT_SECRET');
    const callbackURL =
      config.get<string>('GOOGLE_CALLBACK_URL') ??
      'http://localhost:3000/auth/google/callback';

    if (!clientID || !clientSecret) {
      Logger.warn(
        'Google OAuth disabled: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET',
        GoogleStrategy.name,
      );
    }

    super({
      // Use placeholders to avoid crashing the API when OAuth is not configured.
      // OAuth routes/guards should be treated as disabled unless real credentials are provided.
      clientID: clientID || 'disabled',
      clientSecret: clientSecret || 'disabled',
      callbackURL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback) {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };
    done(null, user);
  }
}
