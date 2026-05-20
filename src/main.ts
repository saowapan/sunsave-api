import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allowed origins come from an env var (comma-separated) so we don't
  // hardcode deploy URLs. Falls back to localhost for local dev.
  const origins = (process.env.CORS_ORIGINS ?? 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim());

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((err) => {
  // Surface startup failures clearly in container logs — a Render or ECS
  // restart loop is undebuggable otherwise.
  console.error('Failed to start application:', err);
  process.exit(1);
});
