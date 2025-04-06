export class TournamentResponseDto {
    _id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    description?: string;
    participantLimit: number;
    entryFee: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }