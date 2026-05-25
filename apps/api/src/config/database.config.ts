import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

// Factory de configuração do TypeORM, lendo do ConfigService.
// Os nomes (POSTGRES_*) são os mesmos usados pelo docker-compose da raiz,
// evitando uma segunda fonte de verdade.
export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('POSTGRES_HOST', 'localhost'),
  port: config.get<number>('POSTGRES_PORT', 5432),
  username: config.get<string>('POSTGRES_USER', 'bebecare'),
  password: config.get<string>('POSTGRES_PASSWORD', 'bebecare_dev_pwd'),
  database: config.get<string>('POSTGRES_DB', 'bebecare'),
  // Entities serão registradas via TypeOrmModule.forFeature em cada módulo.
  // Em produção, prefira passar `entities: [...]` explicitamente ao invés de autoload.
  autoLoadEntities: true,
  // synchronize NUNCA em prod — só em dev se quiser ser rápido. Aqui usamos migrations.
  synchronize: false,
  migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
  migrationsRun: false,
  logging: config.get<string>('NODE_ENV') !== 'production',
});
