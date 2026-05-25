import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration do bloco A7 — remédios + horários + log de doses.
 *
 * Cria 3 tabelas:
 *  - medications
 *  - med_schedules
 *  - med_dose_logs
 *
 * E os enums dose_unit_enum e dose_status_enum.
 */
export class Medications1779890000000 implements MigrationInterface {
  name = 'Medications1779890000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ENUMS ---------------------------------------------------------------
    await queryRunner.query(`
      CREATE TYPE "dose_unit_enum" AS ENUM ('drop', 'ml', 'mg', 'tablet', 'sachet')
    `);

    await queryRunner.query(`
      CREATE TYPE "dose_status_enum" AS ENUM ('pending', 'taken', 'skipped')
    `);

    // MEDICATIONS ---------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "medications" (
        "id"              uuid             NOT NULL,
        "baby_id"         uuid             NOT NULL,
        "family_id"       uuid             NOT NULL,
        "name"            varchar(120)     NOT NULL,
        "dose"            numeric(10,3)    NOT NULL,
        "dose_unit"       dose_unit_enum   NOT NULL,
        "instructions"    text,
        "start_date"      date             NOT NULL,
        "end_date"        date,
        "is_active"       boolean          NOT NULL DEFAULT true,
        "created_at"      timestamptz      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"      timestamptz      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "deleted_at"      timestamptz,
        CONSTRAINT "PK_medications" PRIMARY KEY ("id"),
        CONSTRAINT "FK_medications_baby"
          FOREIGN KEY ("baby_id") REFERENCES "babies"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_medications_family"
          FOREIGN KEY ("family_id") REFERENCES "families"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_medications_baby_active"
        ON "medications" ("baby_id", "is_active")
    `);

    // MED_SCHEDULES --------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "med_schedules" (
        "id"                  uuid          NOT NULL,
        "medication_id"       uuid          NOT NULL,
        "time"                varchar(5)    NOT NULL,
        "days_of_week_mask"   int           NOT NULL DEFAULT 127,
        "use_alarm"           boolean       NOT NULL DEFAULT true,
        "is_active"           boolean       NOT NULL DEFAULT true,
        "created_at"          timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"          timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_med_schedules" PRIMARY KEY ("id"),
        CONSTRAINT "FK_med_schedules_medication"
          FOREIGN KEY ("medication_id") REFERENCES "medications"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "CHK_med_schedules_days_mask"
          CHECK ("days_of_week_mask" BETWEEN 1 AND 127),
        CONSTRAINT "CHK_med_schedules_time_format"
          CHECK ("time" ~ '^[0-2][0-9]:[0-5][0-9]$')
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_med_schedules_medication_id"
        ON "med_schedules" ("medication_id")
    `);

    // MED_DOSE_LOGS --------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "med_dose_logs" (
        "id"                  uuid              NOT NULL,
        "medication_id"       uuid              NOT NULL,
        "schedule_id"         uuid              NOT NULL,
        "baby_id"             uuid              NOT NULL,
        "family_id"           uuid              NOT NULL,
        "scheduled_for"       timestamptz       NOT NULL,
        "status"              dose_status_enum  NOT NULL DEFAULT 'pending',
        "taken_at"            timestamptz,
        "skip_reason"         varchar(200),
        "logged_by_user_id"   uuid,
        "created_at"          timestamptz       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"          timestamptz       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_med_dose_logs" PRIMARY KEY ("id"),
        CONSTRAINT "FK_med_dose_logs_medication"
          FOREIGN KEY ("medication_id") REFERENCES "medications"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_med_dose_logs_schedule"
          FOREIGN KEY ("schedule_id") REFERENCES "med_schedules"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_med_dose_logs_baby"
          FOREIGN KEY ("baby_id") REFERENCES "babies"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_med_dose_logs_family"
          FOREIGN KEY ("family_id") REFERENCES "families"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_med_dose_logs_user"
          FOREIGN KEY ("logged_by_user_id") REFERENCES "users"("id")
          ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);

    // Lookups frequentes
    await queryRunner.query(`
      CREATE INDEX "IDX_med_dose_logs_baby_scheduled"
        ON "med_dose_logs" ("baby_id", "scheduled_for")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_med_dose_logs_status"
        ON "med_dose_logs" ("status")
    `);

    // Garante que o cron diário não duplique logs pro mesmo schedule no mesmo horário
    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_med_dose_logs_schedule_day_unique"
        ON "med_dose_logs" ("schedule_id", "scheduled_for")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "med_dose_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "med_schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "medications"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dose_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "dose_unit_enum"`);
  }
}
