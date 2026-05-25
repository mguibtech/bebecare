import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration do bloco A2 — auth com refresh token rotativo.
 *
 * Cria a tabela refresh_tokens. Apenas o hash sha256 do token é armazenado
 * (token plain text fica em memória pelo tempo da resposta HTTP).
 *
 * Índices:
 *  - token_hash UNIQUE (lookup direto no /auth/refresh)
 *  - user_id (pra revogar todos os refresh de um user no logout-all)
 *  - expires_at (pra job de limpeza dos expirados)
 */
export class RefreshTokens1779850000000 implements MigrationInterface {
  name = 'RefreshTokens1779850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id"              uuid          NOT NULL,
        "token_hash"      varchar(64)   NOT NULL,
        "user_id"         uuid          NOT NULL,
        "expires_at"      timestamptz   NOT NULL,
        "revoked_at"      timestamptz,
        "replaced_by_id"  uuid,
        "created_by_ip"   varchar(64),
        "user_agent"      varchar(255),
        "created_at"      timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"      timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "FK_refresh_tokens_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_refresh_tokens_token_hash_unique"
        ON "refresh_tokens" ("token_hash")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_user_id"
        ON "refresh_tokens" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_refresh_tokens_expires_at"
        ON "refresh_tokens" ("expires_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "refresh_tokens"`);
  }
}
