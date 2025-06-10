import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './_common/config';
import helmet from 'helmet';
// import { printGraph } from './_common/print-graph';

async function bootstrap() {
  console.log('Starting application...');
  console.log('Memory usage before app creation:', process.memoryUsage());

  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production' ? ['error', 'warn'] : undefined,
    bufferLogs: false,
    abortOnError: false,
  });

  console.log('Memory usage after app creation:', process.memoryUsage());

  // printGraph(app);

  app.enableCors({ origin: appConfig.CLIENT_URL });
  app.setGlobalPrefix('api');
  app.use(helmet());

  await app.listen(appConfig.PORT);
}

void bootstrap();
