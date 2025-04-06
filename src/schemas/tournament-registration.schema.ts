// tournament-registration.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TournamentRegistrationDocument = TournamentRegistration & Document;

@Schema({ timestamps: true })
export class TournamentRegistration {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Tournament', required: true })
  tournamentId: MongooseSchema.Types.ObjectId;

  @Prop({ default: 'pending' })
  status: string;  // 'pending', 'approved', 'rejected'

  @Prop({ default: false })
  hasPaid: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed })
  paymentDetails: Record<string, any>;
}

export const TournamentRegistrationSchema = SchemaFactory.createForClass(TournamentRegistration);