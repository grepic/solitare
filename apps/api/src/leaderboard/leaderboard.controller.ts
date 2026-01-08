import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Query('period') period?: 'daily' | 'weekly' | 'allTime',
    @Query('limit') limit?: number,
  ) {
    return this.leaderboardService.getLeaderboard(period, limit);
  }

  @Get('rank')
  @UseGuards(JwtAuthGuard)
  async getUserRank(@Req() req, @Query('period') period?: 'daily' | 'weekly' | 'allTime') {
    return this.leaderboardService.getUserRank(req.user.id, period);
  }
}
