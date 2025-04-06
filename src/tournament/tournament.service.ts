// tournament.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tournament, TournamentDocument } from 'src/schemas/tournament.schema';
import { CreateTournamentDto } from './dto/tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';

@Injectable()
export class TournamentService {
  constructor(
    @InjectModel(Tournament.name)
    private tournamentModel: Model<TournamentDocument>,
  ) {}

  async create(createTournamentDto: CreateTournamentDto): Promise<TournamentResponseDto> {
    // Create a new tournament
    const tournament = new this.tournamentModel({
      name: createTournamentDto.name,
      startDate: new Date(createTournamentDto.startDate),
      endDate: new Date(createTournamentDto.endDate),
      description: createTournamentDto.description,
      participantLimit: createTournamentDto.participantLimit,
      entryFee: createTournamentDto.entryFee,
      isActive: true,
    });

    // Save the tournament to the database
    const savedTournament = await tournament.save();
    return this.mapToDto(savedTournament);
  }

  async findAll(): Promise<TournamentResponseDto[]> {
    const tournaments = await this.tournamentModel.find().exec();
    return tournaments.map(tournament => this.mapToDto(tournament));
  }

  async findOne(id: string): Promise<TournamentResponseDto> {
    const tournament = await this.tournamentModel.findById(id).exec();
    
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }
    
    return this.mapToDto(tournament);
  }

  private mapToDto(tournament: TournamentDocument): TournamentResponseDto {
    const plainTournament = tournament.toObject();
    return {
      _id: plainTournament._id.toString(),
      name: plainTournament.name,
      startDate: plainTournament.startDate,
      endDate: plainTournament.endDate,
      description: plainTournament.description,
      participantLimit: plainTournament.participantLimit,
      entryFee: plainTournament.entryFee instanceof Object ? 
        Number(plainTournament.entryFee.toString()) : 
        plainTournament.entryFee,
      isActive: plainTournament.isActive,
      createdAt: plainTournament.createdAt,
      updatedAt: plainTournament.updatedAt,
    };
  }
}