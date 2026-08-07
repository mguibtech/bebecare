import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildPostgresConnectionOptions } from '../config/datasource-options';

// Carrega variáveis do .env quando rodando via CLI (npm run migration:*)
loadEnv();

// DataSource standalone usado pelo CLI do TypeORM para rodar migrations.
// O AppModule usa a factory em src/config/database.config.ts; ambos derivam a
// conexão de buildPostgresConnectionOptions, então não há duas fontes de verdade.
//
// IMPORTANTE: o CLI exige UM ÚNICO export de DataSource neste arquivo.
// Por isso só temos `export default` — não criar `export const` adicional.
export default new DataSource({
  ...buildPostgresConnectionOptions(),
  // Globs para encontrar entidades e migrations a partir deste arquivo
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
});
