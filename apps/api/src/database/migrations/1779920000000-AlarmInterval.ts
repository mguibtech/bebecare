import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adiciona o modo "intervalo" aos despertadores (M7).
 *
 * `interval_hours` NULL = horário único (comportamento original). Se preenchido
 * (ex: 3), o despertador toca a cada N horas a partir de `time`, cobrindo 24h.
 * Bebês mamam de 3 em 3h ou 4 em 4h conforme a nutricionista.
 */
export class AlarmInterval1779920000000 implements MigrationInterface {
  name = 'AlarmInterval1779920000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alarms" ADD COLUMN "interval_hours" int
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "alarms" DROP COLUMN IF EXISTS "interval_hours"
    `);
  }
}
