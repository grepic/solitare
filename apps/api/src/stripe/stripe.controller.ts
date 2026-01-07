import { Controller, Post, Body, UseGuards, Req, Headers, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDepositIntentDto, CreateWithdrawalRequestDto } from '@solitaire/shared';

@Controller('wallet')
export class StripeController {
  constructor(private stripeService: StripeService) {}

  @Post('deposit-intent')
  @UseGuards(JwtAuthGuard)
  async createDepositIntent(@Req() req, @Body() dto: CreateDepositIntentDto) {
    return this.stripeService.createDepositIntent(req.user.id, dto.amountCents);
  }

  @Post('withdraw-request')
  @UseGuards(JwtAuthGuard)
  async createWithdrawalRequest(@Req() req, @Body() dto: CreateWithdrawalRequestDto) {
    return this.stripeService.createWithdrawalRequest(
      req.user.id,
      dto.amountCents,
      dto.payoutMethod,
      dto.payoutDetails,
    );
  }

  @Post('/webhooks/stripe')
  async handleStripeWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    return this.stripeService.handleWebhook(signature, req.rawBody!);
  }
}
