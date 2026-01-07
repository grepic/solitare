import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { MatchService } from './match.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('match')
@UseGuards(JwtAuthGuard)
export class MatchController {
  constructor(private matchService: MatchService) {}

  @Get('lobby/tiers')
  async getLobbyTiers() {
    return this.matchService.getLobbyTiers();
  }

  @Get(':id')
  async getMatch(@Param('id') matchId: string) {
    return this.matchService.getMatch(matchId);
  }

  @Get(':id/state')
  async getMatchState(@Param('id') matchId: string, @Req() req) {
    const match = await this.matchService.getMatch(matchId);
    const moves = await this.matchService.getMatchMoves(matchId, req.user.id);

    return {
      seed: match?.seed,
      moves,
      currentSeq: moves[moves.length - 1]?.seq || 0,
    };
  }
}
