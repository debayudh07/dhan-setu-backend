import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { User, UserSchema } from '../schemas/user.schema';
import { Otp, OtpSchema } from '../schemas/otp.schema';
import { ProfileService } from './profile.service';
import { ProfileController } from './profile.controller';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { SmsService } from './sms.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [ProfileController],
  providers: [ProfileService, CloudinaryService, SmsService],
  exports: [ProfileService],
})
export class ProfileModule {}