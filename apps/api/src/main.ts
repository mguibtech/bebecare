import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

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

  // CORS liberado em dev — restringir em produção
  app.enableCors({
    origin: true,
    credentials: true,
  });

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

  const port = Number(process.env.API_PORT ?? 3000);
  await app.listen(port);

  Logger.log(`🍼 BebeCare API rodando em http://localhost:${port}/api`, 'Bootstrap');
}

bootstrap();
