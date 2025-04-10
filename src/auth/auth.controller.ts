import { Controller, Post, Body, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto, LoginDto } from './dto/auth.dto';
import { AuthGuard } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates the Google OAuth flow
    // The empty method is intentional
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    try {
      const { token, redirectUrl } = await this.authService.validateGoogleUser(req.user);
      
      // Get frontend URL from config
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
      
      // Set token as HTTP-only cookie
      res.cookie('token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production', // Only use secure in production
        sameSite: 'lax', // Helps with CSRF protection
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });
      
      // Redirect to the provided URL
      return res.redirect(`${frontendUrl}${redirectUrl}`);
    } catch (error) {
      // Handle errors gracefully
      console.error('Google auth error:', error);
      return res.redirect(`${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000'}/auth/error`);
    }
  }
}