import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.enableCors({ origin: process.env['ALLOWED_ORIGINS']?.split(',') ?? '*' });

  if (process.env['NODE_ENV'] !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('BiblioFlow API Gateway')
      .setDescription('Single entry point for all BiblioFlow services')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
  }

  const port = process.env['PORT'] ?? 3000;
  await app.listen(port);
  console.log(`🚀 BiblioFlow API Gateway running on http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/docs`);
}

bootstrap();
