import { Controller, Get, Patch, Body, UseGuards, Req, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from '@solitaire/shared';

@Controller('me')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  async getProfile(@Req() req) {
    return this.userService.getProfile(req.user.id);
  }

  @Patch('profile')
  async updateProfile(@Req() req, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Get('matches')
  async getMatchHistory(
    @Req() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.userService.getMatchHistory(req.user.id, limit, offset);
  }
}
