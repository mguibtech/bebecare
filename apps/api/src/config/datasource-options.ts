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

  // Terceira forma: as PG* padrão do libpq. O service Postgres do Railway
  // expõe exatamente esses nomes, então referenciá-los direto também funciona.
  const host = environment.POSTGRES_HOST ?? environment.PGHOST;

  // Em produção, cair nos defaults de dev vira `ECONNREFUSED 127.0.0.1:5432`
  // no pre-deploy — erro que não diz o que está faltando. Falha explicando,
  // e lista as variáveis relacionadas que EXISTEM (só nomes, nunca valores)
  // pra deixar óbvio se a reference do painel não resolveu.
  if (environment.NODE_ENV === 'production' && !host) {
    const seen = Object.keys(environment)
      .filter((name) => /^(DATABASE|PG|POSTGRES)/.test(name))
      .sort();

    throw new Error(
      'Nenhuma configuração de banco encontrada em produção. Defina DATABASE_URL ' +
        '(no Railway: DATABASE_URL=${{Postgres.DATABASE_URL}}) ou as vars ' +
        'POSTGRES_HOST/PORT/USER/PASSWORD/DB. Ver DEPLOY.md. ' +
        `Variáveis de banco presentes no ambiente: ${seen.length ? seen.join(', ') : '(nenhuma)'}.`,
    );
  }

  return {
    type: 'postgres',
    host: host ?? 'localhost',
    port: Number(environment.POSTGRES_PORT ?? environment.PGPORT ?? 5432),
    username: environment.POSTGRES_USER ?? environment.PGUSER ?? 'bebecare',
    password: environment.POSTGRES_PASSWORD ?? environment.PGPASSWORD ?? 'bebecare_dev_pwd',
    database: environment.POSTGRES_DB ?? environment.PGDATABASE ?? 'bebecare',
    ssl,
  };
}
