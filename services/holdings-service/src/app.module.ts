import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HoldingsController } from './presentation/controllers/holdings.controller';
import { PrismaService } from './infrastructure/prisma/prisma.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HoldingsController],
  providers: [PrismaService],
})
export class AppModule {}
