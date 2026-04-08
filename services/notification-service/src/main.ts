import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });
  const port = process.env.PORT ?? 3005;
  await app.listen(port);
  Logger.log(`Notification Service running on port ${port}`, 'Bootstrap');
}

bootstrap().catch((err) => {
  Logger.error('Failed to start Notification Service', err);
  process.exit(1);
});
