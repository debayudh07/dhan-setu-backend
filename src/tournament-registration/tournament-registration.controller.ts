import { Controller, Post, Get, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TournamentRegistrationService } from './tournament-registration.service';
import { CreateTournamentRegistrationDto } from './dto/tournament-registration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('tournament-registrations')
@Controller('tournament-registrations')
export class TournamentRegistrationController {
  constructor(private readonly tournamentRegistrationService: TournamentRegistrationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register for a tournament' })
  @ApiResponse({ status: 201, description: 'Successfully registered for tournament' })
  async registerForTournament(
    @Req() req,
    @Body() createTournamentRegistrationDto: CreateTournamentRegistrationDto,
  ) {
    return this.tournamentRegistrationService.registerForTournament(
      req.user._id,
      createTournamentRegistrationDto,
    );
  }

  @Get('my-tournaments')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get tournaments the user is registered for' })
  async getUserTournaments(@Req() req) {
    return this.tournamentRegistrationService.getUserTournaments(req.user._id);
  }

  @Get('tournament/:tournamentId/participants')
  @ApiOperation({ summary: 'Get participants of a tournament' })
  async getTournamentParticipants(@Param('tournamentId') tournamentId: string) {
    return this.tournamentRegistrationService.getTournamentParticipants(tournamentId);
  }

  @Patch(':registrationId/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update registration status (for admins)' })
  async updateRegistrationStatus(
    @Param('registrationId') registrationId: string,
    @Body('status') status: string,
  ) {
    return this.tournamentRegistrationService.updateRegistrationStatus(registrationId, status);
  }
}