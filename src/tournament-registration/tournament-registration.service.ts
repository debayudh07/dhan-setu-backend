import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types as MongooseTypes } from 'mongoose';
import { TournamentRegistration , TournamentRegistrationDocument } from 'src/schemas/tournament-registration.schema';
import { TournamentDocument, Tournament } from 'src/schemas/tournament.schema';
import { User, UserDocument } from 'src/schemas/user.schema';
import { CreateTournamentRegistrationDto } from './dto/tournament-registration.dto';

@Injectable()
export class TournamentRegistrationService {
  constructor(
    @InjectModel(TournamentRegistration.name)
    private registrationModel: Model<TournamentRegistrationDocument>,
    @InjectModel(Tournament.name)
    private tournamentModel: Model<TournamentDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async registerForTournament(
    userId: string,
    createTournamentRegistrationDto: CreateTournamentRegistrationDto,
  ): Promise<TournamentRegistrationDocument> {
    // Check if tournament exists
    const tournament = await this.tournamentModel.findById(createTournamentRegistrationDto.tournamentId);
    if (!tournament) {
      throw new NotFoundException('Tournament not found');
    }

    // Check if user exists
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user is already registered for this tournament
    const existingRegistration = await this.registrationModel.findOne({
      userId,
      tournamentId: createTournamentRegistrationDto.tournamentId,
    });
    
    if (existingRegistration) {
      throw new BadRequestException('User is already registered for this tournament');
    }

    // Check if tournament has reached participant limit
    const registrationCount = await this.registrationModel.countDocuments({
      tournamentId: createTournamentRegistrationDto.tournamentId,
      status: { $ne: 'rejected' },
    });

    if (tournament.participantLimit > 0 && registrationCount >= tournament.participantLimit) {
      throw new BadRequestException('Tournament has reached its participant limit');
    }

    // Create new registration
    const newRegistration = new this.registrationModel({
      userId,
      tournamentId: createTournamentRegistrationDto.tournamentId,
      status: tournament.entryFee > 0 && !createTournamentRegistrationDto.hasPaid ? 'pending' : 'approved',
      hasPaid: createTournamentRegistrationDto.hasPaid || false,
      paymentDetails: createTournamentRegistrationDto.paymentDetails,
    });

    return newRegistration.save();
  }

  async getUserTournaments(userId: string): Promise<any[]> {
    // Find all registrations for the user
    const registrations = await this.registrationModel.find({ userId }).exec();
    
    // Get the tournament ids from the registrations
    const tournamentIds = registrations.map(reg => reg.tournamentId);
    
    // Find all tournaments using the tournament ids
    const tournaments = await this.tournamentModel.find({
      _id: { $in: tournamentIds }
    }).exec() as TournamentDocument[];
    
    // Map tournaments to include registration status
    return tournaments.map((tournament) => {
        const registration = registrations.find(reg => 
          reg.tournamentId.toString() === (tournament._id as MongooseTypes.ObjectId).toString()
        );
      
      const registrationData = registration ? {
        registrationStatus: registration.status,
        hasPaid: registration.hasPaid
      } : {
        registrationStatus: null,
        hasPaid: false
      };
      
      return {
        ...tournament.toObject(),
        ...registrationData
      };
    });
  }

  async getTournamentParticipants(tournamentId: string): Promise<any[]> {
    // Find all registrations for the tournament
    const registrations = await this.registrationModel.find({
      tournamentId
    }).exec();
    
    if (registrations.length === 0) {
      return [];
    }
    
    // Get all user IDs from registrations
    const userIds = registrations.map(reg => reg.userId);
    
    // Find all users and include their registration status
    const users = await this.userModel.find({
      _id: { $in: userIds }
    }).select('-password').exec() as UserDocument[];
    
    // Combine user data with registration status
    return users.map(user => {
      const registration = registrations.find(reg => 
        reg.userId.toString() === (user._id as MongooseTypes.ObjectId).toString()
      );
      
      return {
        ...user.toObject(),
        registrationStatus: registration?.status,
        hasPaid: registration?.hasPaid || false
      };
    });
  }

  async updateRegistrationStatus(
    registrationId: string, 
    status: string
  ): Promise<TournamentRegistrationDocument> {
    const registration = await this.registrationModel.findById(registrationId);
    
    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    
    registration.status = status;
    return registration.save();
  }
}