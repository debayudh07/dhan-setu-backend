import { PassportStrategy } from '@nestjs/passport'; 
import { Injectable } from '@nestjs/common'; 
import { Strategy } from 'passport-google-oauth20'; 
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../auth.service';  

@Injectable() 
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {   
  constructor(
    private authService: AuthService,
    private configService: ConfigService
  ) {     
    super({       
      clientID: configService.get<string>('GOOGLE_CLIENT_ID'),       
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),       
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),       
      scope: ['email', 'profile'],     
    });   
  }    

  async validate(accessToken: string, refreshToken: string, profile: any) {     
    const { id: googleId, emails, displayName, photos } = profile;     
    const email = emails[0].value;     
    const profilePhotoUrl = photos && photos.length > 0 ? photos[0].value : null;          
    
    const userData = {       
      googleId,       
      email,       
      name: displayName,       
      profilePicture: profilePhotoUrl,
      accessToken,
      refreshToken
    };
    
    // Return the user data directly without validation
    // Let the controller handle the validation and transformation
    return userData;  
  } 
}