import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
    rawBody: true, // Enable raw body globally
  });

  // Custom middleware for Stripe webhooks - preserve raw body
  app.use(
    '/api/wallet/webhooks/stripe',
    express.raw({ type: 'application/json' }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📝 API Documentation: http://localhost:${port}/api`);
  console.log(`🔐 Stripe webhook endpoint: http://localhost:${port}/api/wallet/webhooks/stripe`);
}

bootstrap();
