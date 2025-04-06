import { Module, OnModuleInit } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { TournamentModule } from './tournament/tournament.module';
import { TournamentRegistrationModule } from './tournament-registration/tournament-registration.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017'),
    AuthModule,
    ProfileModule,
    CloudinaryModule,
    TournamentModule,
    TournamentRegistrationModule,
  ],
})
export class AppModule implements OnModuleInit {
  onModuleInit() {
    console.log('Successfully connected to the MongoDB database!');
  }
}