// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../../schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    // Log the payload to see what's in it
    console.log('JWT Payload:', payload);
    
    // Check all possible ID field names that might be in your token
    const userId = payload.userId || payload.sub || payload.id;
    
    // Find the user with the extracted ID
    const user = await this.userModel.findById(userId);
    
    if (!user) {
      console.log(`User with ID ${userId} not found`);
      throw new UnauthorizedException('User not found');
    }
    
    // Return the user object that will be injected into the request
    return user;
  }
}