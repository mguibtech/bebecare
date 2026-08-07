import 'reflect-metadata';
import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

// Carrega variáveis do .env quando rodando via CLI (npm run migration:*)
loadEnv();

// DataSource standalone usado pelo CLI do TypeORM para rodar migrations.
// O AppModule usa a factory em src/config/database.config.ts; mantemos os dois
// alinhados manualmente para evitar acoplar o CLI ao container do Nest.
//
// IMPORTANTE: o CLI exige UM ÚNICO export de DataSource neste arquivo.
// Por isso só temos `export default` — não criar `export const` adicional.
//
// SSL liga em prod ou via POSTGRES_SSL=true — necessário pra rodar as
// migrations contra um Postgres gerenciado. POSTGRES_SSL=false desliga MESMO
// em prod (ex.: Railway via rede privada). Manter alinhado com database.config.ts.
const sslEnabled =
  process.env.POSTGRES_SSL === 'true' ||
  (process.env.POSTGRES_SSL !== 'false' && process.env.NODE_ENV === 'production');

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST ?? 'localhost',
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  username: process.env.POSTGRES_USER ?? 'bebecare',
  password: process.env.POSTGRES_PASSWORD ?? 'bebecare_dev_pwd',
  database: process.env.POSTGRES_DB ?? 'bebecare',
  // Globs para encontrar entidades e migrations a partir deste arquivo
  entities: [__dirname + '/../**/*.entity.{ts,js}'],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production',
  ssl: sslEnabled ? { rejectUnauthorized: false } : false,
});
