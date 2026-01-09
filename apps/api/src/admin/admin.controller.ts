import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { StripeService } from '../stripe/stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private stripeService: StripeService,
  ) {}

  @Get('users')
  async getUsers(@Query('search') search?: string, @Query('limit') limit?: number) {
    return this.adminService.getUsers(search, limit);
  }

  @Patch('users/:id/ban')
  async banUser(@Param('id') userId: string, @Body() dto: { reason: string; durationDays?: number }) {
    return this.adminService.banUser(userId, dto.reason, dto.durationDays);
  }

  @Patch('users/:id/unban')
  async unbanUser(@Param('id') userId: string) {
    return this.adminService.unbanUser(userId);
  }

  @Get('age-verification/pending')
  async getPendingVerifications() {
    return this.adminService.getPendingAgeVerifications();
  }

  @Patch('age-verification/:id/approve')
  async approveVerification(@Param('id') requestId: string, @Body() dto: { adminId: string }) {
    return this.adminService.approveAgeVerification(requestId, dto.adminId);
  }

  @Patch('age-verification/:id/reject')
  async rejectVerification(@Param('id') requestId: string, @Body() dto: { adminId: string; reason: string }) {
    return this.adminService.rejectAgeVerification(requestId, dto.adminId, dto.reason);
  }

  @Post('daily-challenge')
  async createDailyChallenge(@Body() dto: { targetScore: number; targetTime: number; rewardCents: number }) {
    return this.adminService.createDailyChallenge(dto.targetScore, dto.targetTime, dto.rewardCents);
  }

  @Get('withdrawals')
  async getWithdrawals(@Query('status') status?: string) {
    return this.adminService.getWithdrawalRequests(status as any);
  }

  @Post('withdrawals/:id/approve')
  async approveWithdrawal(@Param('id') id: string, @Req() req) {
    const result = await this.stripeService.approveWithdrawal(id, req.user.id);

    await this.adminService.createAuditLog(
      req.user.id,
      'APPROVE_WITHDRAWAL',
      'WithdrawalRequest',
      id,
      {},
    );

    return result;
  }

  @Post('withdrawals/:id/reject')
  async rejectWithdrawal(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req,
  ) {
    const result = await this.stripeService.rejectWithdrawal(id, req.user.id, body.reason);

    await this.adminService.createAuditLog(
      req.user.id,
      'REJECT_WITHDRAWAL',
      'WithdrawalRequest',
      id,
      { reason: body.reason },
    );

    return result;
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats();
  }

  @Get('revenue-stats')
  async getRevenueStats() {
    return this.adminService.getRevenueStats();
  }
}
