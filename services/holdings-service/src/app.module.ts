import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HoldingsController } from './presentation/controllers/holdings.controller';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [HoldingsController],
  providers: [],
})
export class AppModule {}
