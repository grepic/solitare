import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { LobbyGateway } from './lobby.gateway';
import { MatchModule } from '../match/match.module';
import { GamesModule } from '../games/games.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [MatchModule, GamesModule, AuthModule],
  providers: [GameGateway, LobbyGateway],
  exports: [LobbyGateway],
})
export class WebSocketModule {}
