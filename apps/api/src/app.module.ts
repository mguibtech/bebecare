import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/database.config';
import { HealthModule } from './health/health.module';

// Módulo raiz da aplicação. Daqui em diante, cada feature do BebeCare
// (auth, users, couples, babies, vaccines, etc.) entra como um módulo importado.
@Module({
  imports: [
    // Carrega variáveis de .env globalmente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    // Conexão TypeORM lendo o ConfigService
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),

    // Health check
    HealthModule,
  ],
})
export class AppModule {}
