import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

// Updated User Schema with Cloudinary URLs and Tokens
export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: false })
  googleId?: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false })
  name: string;

  @Prop({ required: false, unique: true })
  username: string;

  @Prop({ 
    required: function() {
      // Password is required only if the user doesn't have googleId
      return !this.googleId;
    } 
  })
  password: string;

  @Prop({ required: false, default: 'local', enum: ['local', 'google'] })
  provider: string;

  @Prop({ required: false })
  profilePicture?: string;
  
  @Prop({ required: false })
  profilePicturePublicId?: string;

  @Prop({
    required: false,
    // validate: {
    //   validator: function(v) {
    //     return v ? /^\+\d{1,4}\d{10}$/.test(v) : true;
    //   },
    //   message: props => `${props.value} is not a valid phone number!`
    // }
  })
  phoneNumber: string;

  @Prop({ required: false, default: false })
  phoneVerified: boolean;

  @Prop({ required: false })
  portfolio?: string;
  
  @Prop({ required: false })
  portfolioPublicId?: string;

  @Prop({ required: false })
  country: string;

  @Prop({ required: false, enum: ['passport', 'dl', 'national', ''] })
  documentType: string;

  @Prop({ required: false })
  documentFrontImage: string;
  
  @Prop({ required: false })
  documentFrontImagePublicId: string;

  @Prop({ required: false })
  documentBackImage: string;
  
  @Prop({ required: false })
  documentBackImagePublicId: string;

  @Prop({ required: false, default: false })
  identityVerified: boolean;

  @Prop({ required: false, default: 0 })
  tokens: number;

  @Prop({ required: false, default: Date.now })
  createdAt: Date;

  @Prop({ required: false, default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add timestamps middleware
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Add middleware to delete Cloudinary resources when user is deleted
UserSchema.pre('findOneAndDelete', async function(next) {
  const user = await this.model.findOne(this.getFilter());
  
  if (!user) return next();
  
  // Delete profile picture from Cloudinary if exists
  if (user.profilePicturePublicId) {
    await cloudinary.uploader.destroy(user.profilePicturePublicId);
  }
  
  // Delete portfolio from Cloudinary if exists
  if (user.portfolioPublicId) {
    await cloudinary.uploader.destroy(user.portfolioPublicId);
  }
  
  // Delete document images from Cloudinary
  if (user.documentFrontImagePublicId) {
    await cloudinary.uploader.destroy(user.documentFrontImagePublicId);
  }
  
  if (user.documentBackImagePublicId) {
    await cloudinary.uploader.destroy(user.documentBackImagePublicId);
  }
  
  next();
});