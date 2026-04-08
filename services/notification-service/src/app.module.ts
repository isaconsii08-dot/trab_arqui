import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoanCreatedHandler } from './event-handlers/loan-created.handler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
  ],
  providers: [LoanCreatedHandler],
})
export class AppModule {}
