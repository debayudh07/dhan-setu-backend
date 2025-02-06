import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User, UserDocument } from './schemas/user.schema';
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

  async validateGoogleUser(profile: any): Promise<{ token: string }> {
    let user = await this.userModel.findOne({ googleId: profile.googleId });

    if (!user) {
      user = new this.userModel({
        googleId: profile.googleId,
        email: profile.email,
        name: profile.name,
      });
      await user.save();
    }

    const token = this.jwtService.sign({ id: user._id, email: user.email });
    return { token };
  }
}
