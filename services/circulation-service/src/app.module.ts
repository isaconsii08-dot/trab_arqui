import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { PrismaLoanRepository } from './infrastructure/persistence/prisma-loan.repository';
import { RedisEventPublisher } from './infrastructure/messaging/redis-event-publisher';
import { HttpPatronClient } from './infrastructure/http/http-patron-client';
import { HttpHoldingsClient } from './infrastructure/http/http-holdings-client';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { CreateLoanSaga } from './application/sagas/create-loan.saga';
import { ReturnItemSaga } from './application/sagas/return-item.saga';
import { CirculationController } from './presentation/controllers/circulation.controller';
import { LOAN_REPOSITORY } from './domain/repositories/loan.repository.interface';
import { EVENT_PUBLISHER } from './application/ports/event-publisher.interface';
import { PATRON_SERVICE_CLIENT } from './application/ports/patron-service-client.interface';
import { HOLDINGS_SERVICE_CLIENT } from './application/ports/holdings-service-client.interface';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env['JWT_SECRET'] ?? 'default_secret',
        signOptions: { expiresIn: '24h' },
      }),
    }),
  ],
  controllers: [CirculationController],
  // El controlador necesita acceder directamente al repositorio para los endpoints de consulta
  providers: [
    PrismaService,
    JwtStrategy,
    { provide: LOAN_REPOSITORY, useClass: PrismaLoanRepository },
    { provide: EVENT_PUBLISHER, useClass: RedisEventPublisher },
    { provide: PATRON_SERVICE_CLIENT, useClass: HttpPatronClient },
    { provide: HOLDINGS_SERVICE_CLIENT, useClass: HttpHoldingsClient },
    {
      provide: CreateLoanSaga,
      useFactory: (
        loanRepo: PrismaLoanRepository,
        patronClient: HttpPatronClient,
        holdingsClient: HttpHoldingsClient,
        eventPublisher: RedisEventPublisher,
      ) => new CreateLoanSaga(loanRepo, patronClient, holdingsClient, eventPublisher),
      inject: [
        { token: LOAN_REPOSITORY, optional: false },
        { token: PATRON_SERVICE_CLIENT, optional: false },
        { token: HOLDINGS_SERVICE_CLIENT, optional: false },
        { token: EVENT_PUBLISHER, optional: false },
      ],
    },
    {
      provide: ReturnItemSaga,
      useFactory: (
        loanRepo: PrismaLoanRepository,
        holdingsClient: HttpHoldingsClient,
        patronClient: HttpPatronClient,
        eventPublisher: RedisEventPublisher,
      ) => new ReturnItemSaga(loanRepo, holdingsClient, patronClient, eventPublisher),
      inject: [
        { token: LOAN_REPOSITORY, optional: false },
        { token: HOLDINGS_SERVICE_CLIENT, optional: false },
        { token: PATRON_SERVICE_CLIENT, optional: false },
        { token: EVENT_PUBLISHER, optional: false },
      ],
    },
  ],
})
export class AppModule {}
