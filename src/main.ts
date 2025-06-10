import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appConfig } from './_common/config';
import helmet from 'helmet';
import { printGraph } from './_common/print-graph';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  printGraph(app);

  app.enableCors({ origin: appConfig.CLIENT_URL });
  app.setGlobalPrefix('api');
  app.use(helmet());

  await app.listen(appConfig.PORT);
}

void bootstrap();
