import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OtpDocument = Otp & Document;

@Schema()
export class Otp {
  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true })
  otp: string;

  @Prop({ required: true, default: Date.now, expires: 600 }) // OTP expires in 10 minutes
  createdAt: Date;
}

export const OtpSchema = SchemaFactory.createForClass(Otp);