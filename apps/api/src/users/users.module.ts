import { Module } from '@nestjs/common';
import { ResponsibleGamingService } from './responsible-gaming.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  providers: [ResponsibleGamingService],
  exports: [ResponsibleGamingService],
})
export class UsersModule {}
