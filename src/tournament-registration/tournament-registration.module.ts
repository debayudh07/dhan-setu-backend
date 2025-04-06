import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TournamentRegistrationController } from './tournament-registration.controller';
import { TournamentRegistrationService } from './tournament-registration.service';
import { TournamentRegistration, TournamentRegistrationSchema} from 'src/schemas/tournament-registration.schema';
import { Tournament, TournamentSchema } from 'src/schemas/tournament.schema';
import { User, UserSchema } from 'src/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TournamentRegistration.name, schema: TournamentRegistrationSchema },
      { name: Tournament.name, schema: TournamentSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [TournamentRegistrationController],
  providers: [TournamentRegistrationService],
  exports: [TournamentRegistrationService],
})
export class TournamentRegistrationModule {}