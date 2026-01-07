import { Controller, Get, Post, Body, UseGuards, Req, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWithdrawalRequestDto } from '@solitaire/shared';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Req() req) {
    return this.walletService.getBalance(req.user.id);
  }

  @Get('transactions')
  async getTransactions(
    @Req() req,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.walletService.getTransactions(req.user.id, limit, offset);
  }

  @Post('withdraw-request')
  async createWithdrawalRequest(@Req() req, @Body() dto: CreateWithdrawalRequestDto) {
    // Implementation in Stripe module
    throw new Error('Not implemented - see Stripe module');
  }
}
