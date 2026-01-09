import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ComplianceController } from './compliance.controller';
import { StripeModule } from '../stripe/stripe.module';
import { CommonModule } from '../common/common.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    StripeModule,
    CommonModule,
    UsersModule,
    PrismaModule,
  ],
  controllers: [
    AdminController,
    ComplianceController,
  ],
  providers: [AdminService],
})
export class AdminModule {}
