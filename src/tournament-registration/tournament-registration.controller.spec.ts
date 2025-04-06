import { Test, TestingModule } from '@nestjs/testing';
import { TournamentRegistrationController } from './tournament-registration.controller';

describe('TournamentRegistrationController', () => {
  let controller: TournamentRegistrationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TournamentRegistrationController],
    }).compile();

    controller = module.get<TournamentRegistrationController>(TournamentRegistrationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
