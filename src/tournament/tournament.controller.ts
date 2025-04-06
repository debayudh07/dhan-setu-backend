// tournament.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TournamentService } from './tournament.service';
import { CreateTournamentDto } from './dto/tournament.dto';
import { TournamentResponseDto } from './dto/tournament-response.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('tournaments')
@Controller('tournaments')
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tournament' })
  @ApiResponse({ 
    status: 201, 
    description: 'The tournament has been successfully created.',
    type: TournamentResponseDto 
  })
  create(@Body() createTournamentDto: CreateTournamentDto): Promise<TournamentResponseDto> {
    return this.tournamentService.create(createTournamentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all tournaments' })
  @ApiResponse({
    status: 200,
    description: 'Return all tournaments',
    type: [TournamentResponseDto]
  })
  findAll(): Promise<TournamentResponseDto[]> {
    return this.tournamentService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific tournament by ID' })
  @ApiParam({ name: 'id', description: 'Tournament ID' })
  @ApiResponse({
    status: 200,
    description: 'Return the tournament',
    type: TournamentResponseDto
  })
  @ApiResponse({ status: 404, description: 'Tournament not found' })
  findOne(@Param('id') id: string): Promise<TournamentResponseDto> {
    return this.tournamentService.findOne(id);
  }
}