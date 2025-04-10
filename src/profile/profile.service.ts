import { Injectable, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Otp, OtpDocument } from '../schemas/otp.schema';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { SmsService } from './sms.service';
import { UpdateProfileDto } from './dto/profile.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Otp.name) private otpModel: Model<OtpDocument>,
    private cloudinaryService: CloudinaryService,
    private smsService: SmsService,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.userModel.findById(userId).select('-password');
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update only provided fields
    Object.keys(updateProfileDto).forEach(key => {
      if (updateProfileDto[key] !== undefined) {
        user[key] = updateProfileDto[key];
      }
    });

    return user.save();
  }

  async uploadProfilePicture(userId: string, file: Express.Multer.File): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete existing profile picture if exists
    if (user.profilePicturePublicId) {
      await this.cloudinaryService.deleteFile(user.profilePicturePublicId);
    }

    // Upload new picture
    const result = await this.cloudinaryService.uploadFile(file, 'profile-pictures');

    // Update user
    user.profilePicture = result.secure_url;
    user.profilePicturePublicId = result.public_id;
    
    return user.save();
  }

  async uploadPortfolio(userId: string, file: Express.Multer.File): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete existing portfolio if exists
    if (user.portfolioPublicId) {
      await this.cloudinaryService.deleteFile(user.portfolioPublicId);
    }

    // Upload new portfolio
    const result = await this.cloudinaryService.uploadFile(file, 'portfolios');

    // Update user
    user.portfolio = result.secure_url;
    user.portfolioPublicId = result.public_id;
    
    return user.save();
  }

  async uploadDocumentImage(
    userId: string,
    side: 'front' | 'back',
    file: Express.Multer.File
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Determine which fields to update based on the side
    const publicIdField = side === 'front' ? 'documentFrontImagePublicId' : 'documentBackImagePublicId';
    const imageField = side === 'front' ? 'documentFrontImage' : 'documentBackImage';

    // Delete existing document image if exists
    if (user[publicIdField]) {
      await this.cloudinaryService.deleteFile(user[publicIdField]);
    }

    // Upload new document image
    const result = await this.cloudinaryService.uploadFile(file, 'documents');

    // Update user
    user[imageField] = result.secure_url;
    user[publicIdField] = result.public_id;
    
    return user.save();
  }

  async requestPhoneVerification(userId: string, phoneNumber: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    // Update the phone number in user model
    user.phoneNumber = phoneNumber;
    user.phoneVerified = false;
    await user.save();
  
    // Send verification code via Twilio Verify API
    // No need to generate or store OTP, as Twilio handles this
    try {
      const result = await this.smsService.sendOtp(phoneNumber);
      
      // We can store the verification SID if needed for reference
      await this.otpModel.findOneAndUpdate(
        { phoneNumber },
        { phoneNumber, verificationSid: result.sid },
        { upsert: true, new: true },
      );
  
      return { message: 'Verification code sent to your phone number' };
    } catch (error) {
      this.logger.error(`Failed to send verification: ${error.message}`);
      throw new HttpException(
        error.message || 'Failed to send verification code',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  async verifyPhoneNumber(userId: string, otp: string): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
  
    // No need to retrieve OTP from database as we're using Twilio Verify
    try {
      // Verify OTP directly with Twilio
      const verificationResult = await this.smsService.verifyOtp(user.phoneNumber, otp);
      
      if (verificationResult.success) {
        // Mark phone as verified
        user.phoneVerified = true;
        await user.save();
        
        // Clean up the verification record
        await this.otpModel.deleteOne({ phoneNumber: user.phoneNumber });
        
        return user;
      } else {
        throw new HttpException('Verification failed', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Verification failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async deleteProfile(userId: string): Promise<void> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // The findOneAndDelete middleware will handle deleting Cloudinary resources
    await this.userModel.findOneAndDelete({ _id: userId });
  }
}