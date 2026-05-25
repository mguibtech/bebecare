import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration inicial — bloco A1 do roadmap V1.
 *
 * Cria os tipos enum e as 4 tabelas-base do BebeCare:
 *  - families
 *  - users
 *  - family_invites
 *  - babies
 *
 * "Family" é deliberadamente neutro: cobre casal hetero/homo, mãe ou pai solo,
 * configurações multigeracionais (avós cuidando), tutores e qualquer outra
 * estrutura de cuidado. O app começa com a Family contendo 1 usuário e
 * cresce conforme convites são aceitos.
 *
 * Convenções aplicadas:
 *  - PKs: UUID v7 (gerado pela app, não pelo Postgres)
 *  - Timestamps: timestamptz com default CURRENT_TIMESTAMP
 *  - Soft delete: coluna deleted_at (NULL = ativo) em families, users e babies
 *  - Índices únicos parciais: email do user (ignorando soft-deleted) e code
 *    do invite (só os PENDING)
 *  - Naming: snake_case nas colunas, plural nas tabelas, prefixos PK_/FK_/IDX_
 *    em constraints
 */
export class InitialSchema1779840000000 implements MigrationInterface {
  name = 'InitialSchema1779840000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----------------------------------------------------------------------
    // ENUMS
    // ----------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TYPE "sex_enum" AS ENUM ('male', 'female')
    `);

    await queryRunner.query(`
      CREATE TYPE "avatar_style_enum" AS ENUM (
        'adventurer',
        'lorelei',
        'micah',
        'personas',
        'notionists',
        'avataaars',
        'bottts',
        'croodles'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "family_invite_status_enum" AS ENUM (
        'pending',
        'accepted',
        'expired',
        'revoked'
      )
    `);

    // ----------------------------------------------------------------------
    // families (criada antes de users porque users referencia families)
    // ----------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "families" (
        "id"          uuid                     NOT NULL,
        "name"        varchar(100),
        "created_at"  timestamptz              NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  timestamptz              NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at"  timestamptz,
        CONSTRAINT "PK_families" PRIMARY KEY ("id")
      )
    `);

    // ----------------------------------------------------------------------
    // users
    // ----------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id"            uuid                NOT NULL,
        "email"         varchar(255)        NOT NULL,
        "name"          varchar(120)        NOT NULL,
        "password_hash" varchar(255)        NOT NULL,
        "fcm_token"     varchar(255),
        "avatar_style"  avatar_style_enum   NOT NULL DEFAULT 'adventurer',
        "avatar_seed"   varchar(100)        NOT NULL,
        "family_id"     uuid                NOT NULL,
        "created_at"    timestamptz         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"    timestamptz         NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at"    timestamptz,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "FK_users_family"
          FOREIGN KEY ("family_id") REFERENCES "families"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);

    // Email único apenas entre usuários ativos — permite reusar email após soft delete.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_users_email_unique"
        ON "users" ("email")
        WHERE "deleted_at" IS NULL
    `);

    // Lookup rápido por família (todas queries do app filtram por family).
    await queryRunner.query(`
      CREATE INDEX "IDX_users_family_id" ON "users" ("family_id")
    `);

    // ----------------------------------------------------------------------
    // family_invites
    // ----------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "family_invites" (
        "id"                    uuid                          NOT NULL,
        "code"                  varchar(6)                    NOT NULL,
        "family_id"             uuid                          NOT NULL,
        "created_by_user_id"    uuid                          NOT NULL,
        "status"                family_invite_status_enum     NOT NULL DEFAULT 'pending',
        "expires_at"            timestamptz                   NOT NULL,
        "accepted_by_user_id"   uuid,
        "accepted_at"           timestamptz,
        "created_at"            timestamptz                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"            timestamptz                   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_family_invites" PRIMARY KEY ("id"),
        CONSTRAINT "FK_family_invites_family"
          FOREIGN KEY ("family_id") REFERENCES "families"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_family_invites_created_by"
          FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "FK_family_invites_accepted_by"
          FOREIGN KEY ("accepted_by_user_id") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    // Código único apenas entre convites PENDING — depois de aceito/expirado, o código pode ser reusado.
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_family_invites_code_pending_unique"
        ON "family_invites" ("code")
        WHERE "status" = 'pending'
    `);

    // Lookups frequentes
    await queryRunner.query(`
      CREATE INDEX "IDX_family_invites_family_id" ON "family_invites" ("family_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_family_invites_status" ON "family_invites" ("status")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_family_invites_expires_at" ON "family_invites" ("expires_at")
    `);

    // ----------------------------------------------------------------------
    // babies
    // ----------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "babies" (
        "id"                  uuid          NOT NULL,
        "family_id"           uuid          NOT NULL,
        "name"                varchar(120)  NOT NULL,
        "sex"                 sex_enum      NOT NULL,
        "birth_date"          date          NOT NULL,
        "birth_weight_grams"  int,
        "birth_height_cm"     numeric(5,2),
        "created_at"          timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"          timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at"          timestamptz,
        CONSTRAINT "PK_babies" PRIMARY KEY ("id"),
        CONSTRAINT "FK_babies_family"
          FOREIGN KEY ("family_id") REFERENCES "families"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_babies_family_id" ON "babies" ("family_id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reversão na ordem inversa de criação para respeitar dependências de FK.
    await queryRunner.query(`DROP TABLE IF EXISTS "babies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "family_invites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "families"`);

    await queryRunner.query(`DROP TYPE IF EXISTS "family_invite_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "avatar_style_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "sex_enum"`);
  }
}
