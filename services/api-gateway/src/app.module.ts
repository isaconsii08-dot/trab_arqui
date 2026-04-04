import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ProxyMiddleware } from './middleware/proxy.middleware';
import { JwtStrategy } from './auth/jwt.strategy';
import { HealthController } from './controllers/health.controller';

// ─────────────────────────────────────────────────────────────────────────────
// API Gateway
// Routes:
//   /api/auth/**        → patron-service:3001/api/v1/auth/**
//   /api/patrons/**     → patron-service:3001/api/v1/patrons/**
//   /api/catalog/**     → catalog-service:3002/api/v1/catalog/**
//   /api/holdings/**    → holdings-service:3003/api/v1/holdings/**
//   /api/circulation/** → circulation-service:3004/api/v1/circulation/**
//   /api/spaces/**      → space-service:3005/api/v1/spaces/**
// ─────────────────────────────────────────────────────────────────────────────

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 10 },
      { name: 'medium', ttl: 10000, limit: 50 },
    ]),
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [HealthController],
  providers: [JwtStrategy],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(ProxyMiddleware).forRoutes('*');
  }
}
