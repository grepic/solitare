import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GamesService, CreateGameLobbyDto } from './games.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GeoRestrictionGuard } from '../common/guards/geo-restriction.guard';
import { AgeVerificationGuard } from '../common/guards/age-verification.guard';
import { ResponsibleGamingGuard } from '../common/guards/responsible-gaming.guard';
import { MatchTier } from '@solitaire/shared';

@Controller('games')
@UseGuards(JwtAuthGuard)
export class GamesController {
  constructor(private readonly gamesService: GamesService) {}

  /**
   * GET /games
   * Get all active game lobbies (lobby browser)
   */
  @Get()
  async getActiveLobbies(@Query('tier') tier?: MatchTier) {
    return this.gamesService.getActiveLobbies(tier);
  }

  /**
   * GET /games/:id
   * Get specific game details
   */
  @Get(':id')
  async getGame(@Param('id') gameId: string) {
    return this.gamesService.getGameById(gameId);
  }

  /**
   * POST /games
   * Create a new game lobby
   */
  @Post()
  @UseGuards(GeoRestrictionGuard, AgeVerificationGuard, ResponsibleGamingGuard)
  async createGameLobby(@Body() dto: CreateGameLobbyDto, @Req() req: any) {
    return this.gamesService.createGameLobby(dto, req.user.userId);
  }

  /**
   * POST /games/:id/join
   * Join an existing game lobby
   */
  @Post(':id/join')
  @UseGuards(GeoRestrictionGuard, AgeVerificationGuard, ResponsibleGamingGuard)
  async joinGame(@Param('id') gameId: string, @Req() req: any) {
    return this.gamesService.joinGame({
      gameId,
      userId: req.user.userId,
    });
  }

  /**
   * POST /games/:id/leave
   * Leave a game lobby (before it starts)
   */
  @Post(':id/leave')
  async leaveGame(@Param('id') gameId: string, @Req() req: any) {
    return this.gamesService.leaveGame(gameId, req.user.userId);
  }

  /**
   * POST /games/:id/cancel
   * Cancel a game (admin or if empty)
   */
  @Delete(':id')
  async cancelGame(@Param('id') gameId: string) {
    return this.gamesService.cancelGame(gameId, 'admin_cancelled');
  }

  /**
   * POST /games/cleanup-expired
   * Cleanup expired limited-time games (cron job)
   */
  @Post('cleanup-expired')
  async cleanupExpiredGames() {
    return this.gamesService.cleanupExpiredGames();
  }
}
