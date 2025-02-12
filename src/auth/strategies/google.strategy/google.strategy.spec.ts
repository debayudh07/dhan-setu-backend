import { Test, TestingModule } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from '../../auth.service';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GoogleStrategy, AuthService],
    }).compile();

    strategy = module.get<GoogleStrategy>(GoogleStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });
});
