import { Test, TestingModule } from '@nestjs/testing';
import { TournamentRegistrationService } from './tournament-registration.service';

describe('TournamentRegistrationService', () => {
  let service: TournamentRegistrationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TournamentRegistrationService],
    }).compile();

    service = module.get<TournamentRegistrationService>(TournamentRegistrationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
