import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import * as dotenv from 'dotenv';
import { AuthService } from '../../auth.service';

dotenv.config(); // Load environment variables

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    const { id: googleId, emails, displayName } = profile;
    const email = emails[0].value;
    const userData = {
      googleId,
      email,
      name: displayName,
    };
    return this.authService.validateGoogleUser(userData);
  }
}
