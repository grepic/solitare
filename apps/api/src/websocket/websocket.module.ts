import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { MatchModule } from '../match/match.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MatchModule, AuthModule],
  providers: [GameGateway],
})
export class WebSocketModule {}
