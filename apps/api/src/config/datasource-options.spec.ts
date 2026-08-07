import { buildPostgresConnectionOptions } from './datasource-options';

// Env mínimo de cada cenário — nunca herda o process.env real, pra o teste não
// depender da máquina onde roda.
function env(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return overrides;
}

describe('buildPostgresConnectionOptions', () => {
  describe('fonte da conexão', () => {
    it('usa DATABASE_URL quando presente (padrão dos hosts gerenciados)', () => {
      const options = buildPostgresConnectionOptions(
        env({ DATABASE_URL: 'postgresql://u:p@db.internal:5432/bebecare' }),
      );

      expect(options).toMatchObject({
        type: 'postgres',
        url: 'postgresql://u:p@db.internal:5432/bebecare',
      });
      // Com URL não montamos host/port separados — o driver parseia a URL.
      expect(options.host).toBeUndefined();
    });

    it('prefere DATABASE_PRIVATE_URL à DATABASE_URL (rede privada, sem egress)', () => {
      const options = buildPostgresConnectionOptions(
        env({
          DATABASE_URL: 'postgresql://u:p@proxy.publico:1234/bebecare',
          DATABASE_PRIVATE_URL: 'postgresql://u:p@postgres.railway.internal:5432/bebecare',
        }),
      );

      expect(options.url).toBe('postgresql://u:p@postgres.railway.internal:5432/bebecare');
    });

    it('ignora URL em branco e cai nas vars discretas', () => {
      const options = buildPostgresConnectionOptions(
        env({ DATABASE_URL: '   ', POSTGRES_HOST: 'db.local' }),
      );

      expect(options.url).toBeUndefined();
      expect(options.host).toBe('db.local');
    });

    it('monta a conexão pelas POSTGRES_* quando não há URL', () => {
      const options = buildPostgresConnectionOptions(
        env({
          POSTGRES_HOST: 'db.local',
          POSTGRES_PORT: '5433',
          POSTGRES_USER: 'user',
          POSTGRES_PASSWORD: 'pwd',
          POSTGRES_DB: 'bebecare_test',
        }),
      );

      expect(options).toMatchObject({
        type: 'postgres',
        host: 'db.local',
        port: 5433,
        username: 'user',
        password: 'pwd',
        database: 'bebecare_test',
      });
    });

    it('cai nos defaults do docker-compose quando nada é informado (dev)', () => {
      const options = buildPostgresConnectionOptions(env());

      expect(options).toMatchObject({
        host: 'localhost',
        port: 5432,
        username: 'bebecare',
        database: 'bebecare',
      });
    });

    it('aceita as PG* do libpq (nomes que o Railway expõe) como fallback', () => {
      const options = buildPostgresConnectionOptions(
        env({
          PGHOST: 'postgres.railway.internal',
          PGPORT: '5432',
          PGUSER: 'postgres',
          PGPASSWORD: 'pwd',
          PGDATABASE: 'railway',
        }),
      );

      expect(options).toMatchObject({
        host: 'postgres.railway.internal',
        port: 5432,
        username: 'postgres',
        database: 'railway',
      });
    });

    it('POSTGRES_* tem prioridade sobre PG* quando as duas existem', () => {
      const options = buildPostgresConnectionOptions(
        env({ POSTGRES_HOST: 'explicito', PGHOST: 'ignorado' }),
      );

      expect(options.host).toBe('explicito');
    });

    it('em produção, falha explicando quando não há nem URL nem host', () => {
      // Sem isso o deploy morreria com um ECONNREFUSED 127.0.0.1 sem contexto.
      expect(() => buildPostgresConnectionOptions(env({ NODE_ENV: 'production' }))).toThrow(
        /DATABASE_URL/,
      );
    });

    it('a falha lista os nomes das vars de banco presentes (diagnóstico)', () => {
      // Ajuda a ver se a reference do painel resolveu pra vazio.
      expect(() =>
        buildPostgresConnectionOptions(
          env({ NODE_ENV: 'production', POSTGRES_SSL: 'true', DATABASE_URL: '' }),
        ),
      ).toThrow(/DATABASE_URL, POSTGRES_SSL/);
    });

    it('em produção, POSTGRES_HOST explícito continua valendo', () => {
      expect(
        buildPostgresConnectionOptions(env({ NODE_ENV: 'production', POSTGRES_HOST: 'db.interno' }))
          .host,
      ).toBe('db.interno');
    });
  });

  describe('TLS', () => {
    it('liga sozinho em produção', () => {
      expect(
        buildPostgresConnectionOptions(env({ NODE_ENV: 'production', POSTGRES_HOST: 'db' })).ssl,
      ).toEqual({
        rejectUnauthorized: false,
      });
    });

    it('fica desligado fora de produção', () => {
      expect(buildPostgresConnectionOptions(env({ NODE_ENV: 'development' })).ssl).toBe(false);
    });

    it('POSTGRES_SSL=false desliga MESMO em produção (rede privada)', () => {
      expect(
        buildPostgresConnectionOptions(
          env({ NODE_ENV: 'production', POSTGRES_SSL: 'false', POSTGRES_HOST: 'db' }),
        ).ssl,
      ).toBe(false);
    });

    it('POSTGRES_SSL=true força TLS fora de produção (staging apontando pra banco gerenciado)', () => {
      expect(
        buildPostgresConnectionOptions(env({ NODE_ENV: 'development', POSTGRES_SSL: 'true' })).ssl,
      ).toEqual({ rejectUnauthorized: false });
    });

    it('aplica a mesma regra de TLS no caminho da URL', () => {
      const options = buildPostgresConnectionOptions(
        env({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://u:p@db/bebecare' }),
      );

      expect(options.ssl).toEqual({ rejectUnauthorized: false });
    });
  });
});
