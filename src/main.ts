import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  // Apply ValidationPipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strips unknown properties
      forbidNonWhitelisted: false, // optionally throw if unknown properties are present
      transform: true, // auto-transform query params to proper types
    }),
  );

  await app.listen(3000);
}
bootstrap();
