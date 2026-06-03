import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration do bloco A8 — despertadores pessoais (mamada / troca / soneca).
 *
 * Cria a tabela alarms e o enum alarm_category_enum.
 */
export class Alarms1779910000000 implements MigrationInterface {
  name = 'Alarms1779910000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "alarm_category_enum" AS ENUM (
        'feeding', 'diaper', 'nap', 'custom'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "alarms" (
        "id"                 uuid                  NOT NULL,
        "user_id"            uuid                  NOT NULL,
        "label"              varchar(80)           NOT NULL,
        "time"               varchar(5)            NOT NULL,
        "days_of_week_mask"  int                   NOT NULL DEFAULT 127,
        "category"           alarm_category_enum   NOT NULL DEFAULT 'custom',
        "sound_key"          varchar(60),
        "is_active"          boolean               NOT NULL DEFAULT true,
        "created_at"         timestamptz           NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"         timestamptz           NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at"         timestamptz,
        CONSTRAINT "PK_alarms" PRIMARY KEY ("id"),
        CONSTRAINT "FK_alarms_user"
          FOREIGN KEY ("user_id") REFERENCES "users"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Lookup mais comum: alarmes ativos do usuário (sync do mobile).
    await queryRunner.query(`
      CREATE INDEX "IDX_alarms_user_active"
        ON "alarms" ("user_id", "is_active")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "alarms"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "alarm_category_enum"`);
  }
}
