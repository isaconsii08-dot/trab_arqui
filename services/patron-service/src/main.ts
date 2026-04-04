import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { DomainExceptionFilter } from './presentation/filters/domain-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug'],
  });

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.enableCors({ origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? '*' });

  // ── Global pipes & filters ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new DomainExceptionFilter());

  // ── API versioning ────────────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Swagger documentation ─────────────────────────────────────────────────
  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('BiblioFlow – Patron Service')
      .setDescription('Manages library members, staff, authentication, and fines')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env['PORT'] ?? 3001;
  await app.listen(port);
  console.log(`🚀 Patron Service running on http://localhost:${port}/api/v1`);
}

bootstrap();
