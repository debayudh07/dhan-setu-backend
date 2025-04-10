import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from '../schemas/user.schema';
import { SignupDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  async signup(dto: SignupDto): Promise<{ token: string }> {
    const { email, password } = dto;

    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({ email, password: hashedPassword });
    await user.save();

    const token = this.jwtService.sign({ id: user._id, email: user.email });
    return { token };
  }

  async login(dto: LoginDto): Promise<{ token: string }> {
    const { email, password } = dto;
    
    const user = await this.userModel.findOne({ email });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({ id: user._id, email: user.email });
    return { token };
  }

  async validateGoogleUser(profile: any): Promise<{ token: string, redirectUrl: string }> {
    // First try to find user by googleId
    let user = await this.userModel.findOne({ googleId: profile.googleId });
    let isNewUser = false;
  
    // If no user found by googleId, try finding by email
    if (!user) {
      user = await this.userModel.findOne({ email: profile.email });
      
      if (user) {
        // Update existing user with Google info
        user.googleId = profile.googleId;
        // Update name if not already set
        if (!user.name && profile.name) {
          user.name = profile.name;
        }
        // Update profile picture from Google if available
        if (profile.profilePicture && (!user.profilePicture || user.googleId)) {
          user.profilePicture = profile.profilePicture;
        }
        await user.save();
      } else {
        // Create new user if neither googleId nor email exists
        isNewUser = true;
        user = new this.userModel({
          googleId: profile.googleId,
          email: profile.email,
          name: profile.name,
          profilePicture: profile.profilePicture,
        });
        await user.save();
      }
    } else {
      // User found by googleId - update profile picture if needed
      if (profile.profilePicture && (!user.profilePicture || (user.profilePicture !== profile.profilePicture))) {
        user.profilePicture = profile.profilePicture;
        await user.save();
      }
    }
  
    // Generate token regardless of whether user is new or existing
    const token = this.jwtService.sign({ id: user._id, email: user.email });
    
    // Redirect to appropriate route based on whether user is new or existing
    const redirectUrl = isNewUser ? '/customize-profile' : '/userdash';
    
    return { token, redirectUrl };
  }
}
