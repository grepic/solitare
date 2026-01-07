import { Controller, Get, Post, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
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
}
