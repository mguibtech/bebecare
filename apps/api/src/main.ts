import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { resolveCorsOptions } from './config/cors.config';

// Bootstrap da aplicação BebeCare
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Prefixo /api em todas as rotas
  app.setGlobalPrefix('api');

  // Validação global de DTOs via class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // remove propriedades não declaradas no DTO
      forbidNonWhitelisted: true, // rejeita request com propriedades extras
      transform: true, // converte payloads para instâncias dos DTOs
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Em produção só libera origens web declaradas em CORS_ALLOWED_ORIGINS.
  // O app React Native não depende de CORS para consumir a API.
  app.enableCors(resolveCorsOptions());

  // Swagger em /api/docs (somente em desenvolvimento)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('BebeCare API')
      .setDescription('API do BebeCare — app de saúde para bebês')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  // Railway e outros hosts gerenciados injetam PORT — respeitar antes do API_PORT.
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3000);
  // 0.0.0.0 pra aceitar conexões externas no container de produção.
  await app.listen(port, '0.0.0.0');

  Logger.log(`🍼 BebeCare API rodando na porta ${port} (prefixo /api)`, 'Bootstrap');
}

void bootstrap();
