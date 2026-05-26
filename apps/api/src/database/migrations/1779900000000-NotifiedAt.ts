import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration do bloco A8 — push notifications.
 *
 * Adiciona a coluna `notified_at` em `appointments` e `med_dose_logs`.
 * Crons de lembrete usam esse campo para garantir idempotência: só envia
 * push se ainda não enviou. Índice parcial (WHERE notified_at IS NULL)
 * mantém a varredura barata mesmo com histórico longo.
 */
export class NotifiedAt1779900000000 implements MigrationInterface {
  name = 'NotifiedAt1779900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // APPOINTMENTS --------------------------------------------------------
    await queryRunner.query(`
      ALTER TABLE "appointments"
      ADD COLUMN "notified_at" timestamptz NULL
    `);

    // Índice parcial: cron faz WHERE notified_at IS NULL AND scheduledAt - reminder ∈ janela.
    // Sem o WHERE no índice, ele cresceria com todo o histórico de consultas
    // já notificadas, o que é desperdício.
    await queryRunner.query(`
      CREATE INDEX "IDX_appointments_pending_notification"
      ON "appointments" ("scheduled_at")
      WHERE "notified_at" IS NULL AND "deleted_at" IS NULL
    `);

    // MED_DOSE_LOGS -------------------------------------------------------
    await queryRunner.query(`
      ALTER TABLE "med_dose_logs"
      ADD COLUMN "notified_at" timestamptz NULL
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_med_dose_logs_pending_notification"
      ON "med_dose_logs" ("scheduled_for")
      WHERE "notified_at" IS NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_med_dose_logs_pending_notification"`);
    await queryRunner.query(`ALTER TABLE "med_dose_logs" DROP COLUMN "notified_at"`);

    await queryRunner.query(`DROP INDEX "IDX_appointments_pending_notification"`);
    await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "notified_at"`);
  }
}
