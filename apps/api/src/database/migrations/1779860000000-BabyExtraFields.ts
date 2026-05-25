import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration do bloco A4 — campos extras do bebê.
 *
 * Adiciona:
 *  - blood_type (enum, opcional)
 *  - allergies (varchar 500, opcional)
 *  - eye_color (varchar 30, opcional)
 *  - notes (text, opcional)
 *  - avatar_style + avatar_seed (DiceBear)
 *
 * Todos os campos são opcionais — pais que não souberem podem ignorar.
 */
export class BabyExtraFields1779860000000 implements MigrationInterface {
  name = 'BabyExtraFields1779860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ------ blood_type_enum ------
    await queryRunner.query(`
      CREATE TYPE "blood_type_enum" AS ENUM (
        'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'
      )
    `);

    // ------ colunas novas em babies ------
    await queryRunner.query(`
      ALTER TABLE "babies"
        ADD COLUMN "blood_type"   blood_type_enum,
        ADD COLUMN "allergies"    varchar(500),
        ADD COLUMN "eye_color"    varchar(30),
        ADD COLUMN "notes"        text,
        ADD COLUMN "avatar_style" avatar_style_enum NOT NULL DEFAULT 'lorelei',
        ADD COLUMN "avatar_seed"  varchar(100)      NOT NULL DEFAULT ''
    `);

    // Para registros existentes (caso já houvesse bebês), atualiza avatar_seed
    // com o nome do bebê (lowercase, sem espaços) como seed default coerente.
    await queryRunner.query(`
      UPDATE "babies"
        SET "avatar_seed" = lower(replace("name", ' ', '-'))
        WHERE "avatar_seed" = ''
    `);

    // Remove o default vazio (era só pra evitar NULL na primeira passagem;
    // queries futuras sempre passam o seed explicitamente).
    await queryRunner.query(`
      ALTER TABLE "babies" ALTER COLUMN "avatar_seed" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "babies"
        DROP COLUMN "avatar_seed",
        DROP COLUMN "avatar_style",
        DROP COLUMN "notes",
        DROP COLUMN "eye_color",
        DROP COLUMN "allergies",
        DROP COLUMN "blood_type"
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS "blood_type_enum"`);
  }
}
