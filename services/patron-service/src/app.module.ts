import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

// Infrastructure
import { PrismaService } from './infrastructure/prisma/prisma.service';
import { PrismaPatronRepository } from './infrastructure/persistence/patron.repository';
import { RedisEventPublisher } from './infrastructure/messaging/redis-event-publisher';

// Domain ports
import { PATRON_REPOSITORY } from './domain/repositories/patron.repository.interface';
import { STAFF_REPOSITORY } from './domain/repositories/staff.repository.interface';
import { EVENT_PUBLISHER } from './application/ports/event-publisher.interface';

// Use cases
import { RegisterPatronUseCase } from './application/use-cases/register-patron.use-case';
import { AuthenticateUseCase } from './application/use-cases/authenticate.use-case';

// Presentation
import { PatronController } from './presentation/controllers/patron.controller';
import { AuthController } from './presentation/controllers/auth.controller';
import { PrismaStaffRepository } from './infrastructure/persistence/staff.repository';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrometheusModule.register(),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '24h') },
      }),
    }),
  ],
  controllers: [AuthController, PatronController],
  providers: [
    // Infrastructure providers
    PrismaService,
    { provide: PATRON_REPOSITORY, useClass: PrismaPatronRepository },
    { provide: STAFF_REPOSITORY, useClass: PrismaStaffRepository },
    { provide: EVENT_PUBLISHER, useClass: RedisEventPublisher },

    // Auth
    JwtStrategy,

    // Use cases
    RegisterPatronUseCase,
    AuthenticateUseCase,
  ],
})
export class AppModule {}
