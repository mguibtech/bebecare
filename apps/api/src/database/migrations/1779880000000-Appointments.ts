import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration do bloco A6 — agenda de consultas pediátricas.
 *
 * Cria a tabela appointments e o enum appointment_status_enum.
 */
export class Appointments1779880000000 implements MigrationInterface {
  name = 'Appointments1779880000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE "appointment_status_enum" AS ENUM (
        'scheduled', 'completed', 'canceled', 'missed'
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "appointments" (
        "id"                        uuid                       NOT NULL,
        "baby_id"                   uuid                       NOT NULL,
        "family_id"                 uuid                       NOT NULL,
        "title"                     varchar(120)               NOT NULL,
        "doctor_name"               varchar(120),
        "specialty"                 varchar(80),
        "scheduled_at"              timestamptz                NOT NULL,
        "location"                  varchar(200),
        "notes"                     text,
        "status"                    appointment_status_enum    NOT NULL DEFAULT 'scheduled',
        "reminder_enabled"          boolean                    NOT NULL DEFAULT true,
        "reminder_minutes_before"   int                        NOT NULL DEFAULT 1440,
        "completed_at"              timestamptz,
        "completed_notes"           text,
        "canceled_at"               timestamptz,
        "cancel_reason"             varchar(200),
        "created_at"                timestamptz                NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"                timestamptz                NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at"                timestamptz,
        CONSTRAINT "PK_appointments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_appointments_baby"
          FOREIGN KEY ("baby_id") REFERENCES "babies"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_appointments_family"
          FOREIGN KEY ("family_id") REFERENCES "families"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    // Lookup mais comum: consultas da família ordenadas por data
    await queryRunner.query(`
      CREATE INDEX "IDX_appointments_family_scheduled"
        ON "appointments" ("family_id", "scheduled_at")
    `);

    // Para o cron de MISSED filtrar rapidamente
    await queryRunner.query(`
      CREATE INDEX "IDX_appointments_status"
        ON "appointments" ("status")
    `);

    // Lookup por bebê
    await queryRunner.query(`
      CREATE INDEX "IDX_appointments_baby_scheduled"
        ON "appointments" ("baby_id", "scheduled_at")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "appointments"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "appointment_status_enum"`);
  }
}
