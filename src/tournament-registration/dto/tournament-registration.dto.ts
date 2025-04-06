import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateTournamentRegistrationDto {
  @IsNotEmpty()
  @IsString()
  tournamentId: string;

  @IsOptional()
  @IsBoolean()
  hasPaid?: boolean;

  @IsOptional()
  paymentDetails?: Record<string, any>;
}