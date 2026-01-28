import { Module } from '@nestjs/common';
import { GamesService } from './games.service';
import { GamesController } from './games.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WalletModule } from '../wallet/wallet.module';
import { CommonModule } from '../common/common.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [PrismaModule, WalletModule, CommonModule, UsersModule],
  controllers: [GamesController],
  providers: [GamesService],
  exports: [GamesService],
})
export class GamesModule {}
