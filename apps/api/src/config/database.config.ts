import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { buildPostgresConnectionOptions } from './datasource-options';

// Factory de configuração do TypeORM, lendo do ConfigService.
// A conexão em si (URL vs POSTGRES_*, SSL) vive em datasource-options.ts,
// compartilhada com o DataSource do CLI de migrations.
export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => {
  // O ConfigService já reflete process.env (+ .env carregado pelo ConfigModule).
  const connection = buildPostgresConnectionOptions(process.env);

  return {
    ...connection,
    // Entities serão registradas via TypeOrmModule.forFeature em cada módulo.
    // Em produção, prefira passar `entities: [...]` explicitamente ao invés de autoload.
    autoLoadEntities: true,
    // synchronize NUNCA em prod — só em dev se quiser ser rápido. Aqui usamos migrations.
    synchronize: false,
    migrations: [__dirname + '/../database/migrations/*.{ts,js}'],
    migrationsRun: false,
    logging: config.get<string>('NODE_ENV') !== 'production',
  };
};
