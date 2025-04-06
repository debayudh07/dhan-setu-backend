// tournament.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type TournamentDocument = Tournament & Document;

@Schema({ timestamps: true })
export class Tournament {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop()
  description: string;

  @Prop({ required: true, default: 0 })
  participantLimit: number;

  @Prop({ required: true, type: MongooseSchema.Types.Decimal128, default: 0 })
  entryFee: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const TournamentSchema = SchemaFactory.createForClass(Tournament);