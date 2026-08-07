import type { DataSourceOptions } from 'typeorm';

/**
 * Monta as opções de conexão do Postgres a partir do ambiente.
 *
 * Duas formas de configurar, nesta ordem de prioridade:
 *
 * 1. **URL única** — `DATABASE_URL` (ou `DATABASE_PRIVATE_URL`). É o padrão dos
 *    hosts gerenciados (Railway expõe as duas no service do banco), e evita a
 *    classe de erro mais chata: uma das cinco `POSTGRES_*` faltando faz o
 *    TypeORM cair no default `localhost` e estourar ECONNREFUSED 127.0.0.1.
 * 2. **Vars discretas** — `POSTGRES_HOST/PORT/USER/PASSWORD/DB`, usadas no
 *    docker-compose local.
 *
 * TLS liga sozinho em produção; `POSTGRES_SSL=false` desliga explicitamente
 * (rede privada do Railway, por exemplo) e `POSTGRES_SSL=true` força em dev.
 */
export type PostgresConnectionOptions = Pick<
  Extract<DataSourceOptions, { type: 'postgres' }>,
  'type' | 'url' | 'host' | 'port' | 'username' | 'password' | 'database' | 'ssl'
>;

export function buildPostgresConnectionOptions(
  environment: NodeJS.ProcessEnv = process.env,
): PostgresConnectionOptions {
  const sslSetting = environment.POSTGRES_SSL;
  const sslEnabled =
    sslSetting === 'true' || (sslSetting !== 'false' && environment.NODE_ENV === 'production');
  const ssl = sslEnabled ? { rejectUnauthorized: false } : false;

  // A URL privada tem prioridade: no Railway ela não passa pela internet
  // pública (sem egress cobrado e sem depender do proxy TCP).
  const url = environment.DATABASE_PRIVATE_URL?.trim() || environment.DATABASE_URL?.trim();

  if (url) {
    return { type: 'postgres', url, ssl };
  }

  return {
    type: 'postgres',
    host: environment.POSTGRES_HOST ?? 'localhost',
    port: Number(environment.POSTGRES_PORT ?? 5432),
    username: environment.POSTGRES_USER ?? 'bebecare',
    password: environment.POSTGRES_PASSWORD ?? 'bebecare_dev_pwd',
    database: environment.POSTGRES_DB ?? 'bebecare',
    ssl,
  };
}
