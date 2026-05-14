import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HoldingsController } from './presentation/controllers/holdings.controller';
import { PrismaService } from './infrastructure/prisma/prisma.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrometheusModule.register()],
  controllers: [HoldingsController],
  providers: [PrismaService],
})
export class AppModule {}
