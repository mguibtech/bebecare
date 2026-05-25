import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration do bloco A5 — PNI brasileiro.
 *
 * Cria tabelas:
 *  - vaccines (catálogo PNI, compartilhado entre todos os usuários)
 *  - vaccine_records (doses aplicadas por bebê, isolado por família)
 *
 * Popula o catálogo com o calendário PNI vigente (2024-2025) para 0-4 anos.
 * Vacinas anuais (Influenza, Covid) ficam fora desta versão — entram em V2
 * quando o modelo de "doses recorrentes" for elaborado.
 *
 * Fonte: https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/c/calendario-nacional-de-vacinacao
 */
export class SeedVaccinesPNI1779870000000 implements MigrationInterface {
  name = 'SeedVaccinesPNI1779870000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ----------------------------------------------------------------------
    // Tabelas
    // ----------------------------------------------------------------------
    await queryRunner.query(`
      CREATE TABLE "vaccines" (
        "id"                      uuid          NOT NULL,
        "code"                    varchar(50)   NOT NULL,
        "name"                    varchar(100)  NOT NULL,
        "description"             text,
        "dose_label"              varchar(50)   NOT NULL,
        "dose_number"             int           NOT NULL,
        "is_booster"              boolean       NOT NULL DEFAULT false,
        "recommended_age_months"  int           NOT NULL,
        "min_age_months"          int           NOT NULL,
        "max_age_months"          int,
        "display_order"           int           NOT NULL DEFAULT 0,
        "is_active"               boolean       NOT NULL DEFAULT true,
        "created_at"              timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"              timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_vaccines" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_vaccines_code_unique" ON "vaccines" ("code")
    `);

    await queryRunner.query(`
      CREATE TABLE "vaccine_records" (
        "id"          uuid          NOT NULL,
        "baby_id"     uuid          NOT NULL,
        "vaccine_id"  uuid          NOT NULL,
        "family_id"   uuid          NOT NULL,
        "applied_at"  date          NOT NULL,
        "lot_number"  varchar(50),
        "location"    varchar(200),
        "notes"       text,
        "created_at"  timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at"  timestamptz   NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "PK_vaccine_records" PRIMARY KEY ("id"),
        CONSTRAINT "FK_vaccine_records_baby"
          FOREIGN KEY ("baby_id") REFERENCES "babies"("id")
          ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "FK_vaccine_records_vaccine"
          FOREIGN KEY ("vaccine_id") REFERENCES "vaccines"("id")
          ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "FK_vaccine_records_family"
          FOREIGN KEY ("family_id") REFERENCES "families"("id")
          ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_vaccine_records_baby_vaccine_unique"
        ON "vaccine_records" ("baby_id", "vaccine_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vaccine_records_family_id" ON "vaccine_records" ("family_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_vaccine_records_applied_at" ON "vaccine_records" ("applied_at")
    `);

    // ----------------------------------------------------------------------
    // Seed do catálogo PNI (calendário oficial 2024-2025, faixa 0-4 anos)
    //
    // Convenções:
    //  - code: SCREAMING_SNAKE_CASE. Estável.
    //  - displayOrder: incremento de 10 pra permitir inserções intermediárias depois.
    //  - Doses únicas: doseNumber=1, doseLabel='Dose única'
    //  - Reforços: isBooster=true
    // ----------------------------------------------------------------------
    type VaccineSeed = {
      code: string;
      name: string;
      description: string;
      doseLabel: string;
      doseNumber: number;
      isBooster: boolean;
      recommendedAgeMonths: number;
      minAgeMonths: number;
      maxAgeMonths: number | null;
      displayOrder: number;
    };

    const seeds: VaccineSeed[] = [
      // ===== AO NASCER =====
      { code: 'BCG',           name: 'BCG',            description: 'Previne formas graves de tuberculose. Aplicada na maternidade.', doseLabel: 'Dose única', doseNumber: 1, isBooster: false, recommendedAgeMonths: 0,  minAgeMonths: 0,  maxAgeMonths: 60,   displayOrder: 10 },
      { code: 'HEPB_BIRTH',    name: 'Hepatite B',     description: 'Primeira dose da Hepatite B, aplicada nas primeiras 24h de vida.', doseLabel: 'Ao nascer', doseNumber: 1, isBooster: false, recommendedAgeMonths: 0,  minAgeMonths: 0,  maxAgeMonths: 1,    displayOrder: 20 },

      // ===== 2 MESES =====
      { code: 'PENTA_1',       name: 'Pentavalente',   description: 'DTP (difteria, tétano, coqueluche) + Hib (Haemophilus influenzae B) + Hepatite B.', doseLabel: '1ª dose', doseNumber: 1, isBooster: false, recommendedAgeMonths: 2,  minAgeMonths: 2,  maxAgeMonths: null, displayOrder: 30 },
      { code: 'VIP_1',         name: 'Poliomielite (VIP)', description: 'Vacina inativada contra poliomielite.', doseLabel: '1ª dose', doseNumber: 1, isBooster: false, recommendedAgeMonths: 2,  minAgeMonths: 2,  maxAgeMonths: null, displayOrder: 40 },
      { code: 'ROTA_1',        name: 'Rotavírus',      description: 'Previne diarreia grave por rotavírus. Janela curta — não pode ser iniciada após 3 meses e 15 dias.', doseLabel: '1ª dose', doseNumber: 1, isBooster: false, recommendedAgeMonths: 2,  minAgeMonths: 2,  maxAgeMonths: 4,    displayOrder: 50 },
      { code: 'PCV10_1',       name: 'Pneumocócica 10v', description: 'Previne pneumonia, meningite e outras doenças pneumocócicas.', doseLabel: '1ª dose', doseNumber: 1, isBooster: false, recommendedAgeMonths: 2,  minAgeMonths: 2,  maxAgeMonths: null, displayOrder: 60 },

      // ===== 3 MESES =====
      { code: 'MENC_1',        name: 'Meningocócica C', description: 'Previne meningite e infecções pelo meningococo C.', doseLabel: '1ª dose', doseNumber: 1, isBooster: false, recommendedAgeMonths: 3,  minAgeMonths: 3,  maxAgeMonths: null, displayOrder: 70 },

      // ===== 4 MESES =====
      { code: 'PENTA_2',       name: 'Pentavalente',   description: 'Segunda dose da pentavalente.', doseLabel: '2ª dose', doseNumber: 2, isBooster: false, recommendedAgeMonths: 4,  minAgeMonths: 4,  maxAgeMonths: null, displayOrder: 80 },
      { code: 'VIP_2',         name: 'Poliomielite (VIP)', description: 'Segunda dose da poliomielite inativada.', doseLabel: '2ª dose', doseNumber: 2, isBooster: false, recommendedAgeMonths: 4,  minAgeMonths: 4,  maxAgeMonths: null, displayOrder: 90 },
      { code: 'ROTA_2',        name: 'Rotavírus',      description: 'Segunda dose. Não pode ser aplicada após 7 meses e 29 dias.', doseLabel: '2ª dose', doseNumber: 2, isBooster: false, recommendedAgeMonths: 4,  minAgeMonths: 4,  maxAgeMonths: 7,    displayOrder: 100 },
      { code: 'PCV10_2',       name: 'Pneumocócica 10v', description: 'Segunda dose da pneumocócica.', doseLabel: '2ª dose', doseNumber: 2, isBooster: false, recommendedAgeMonths: 4,  minAgeMonths: 4,  maxAgeMonths: null, displayOrder: 110 },

      // ===== 5 MESES =====
      { code: 'MENC_2',        name: 'Meningocócica C', description: 'Segunda dose da meningocócica C.', doseLabel: '2ª dose', doseNumber: 2, isBooster: false, recommendedAgeMonths: 5,  minAgeMonths: 5,  maxAgeMonths: null, displayOrder: 120 },

      // ===== 6 MESES =====
      { code: 'PENTA_3',       name: 'Pentavalente',   description: 'Terceira e última dose da pentavalente.', doseLabel: '3ª dose', doseNumber: 3, isBooster: false, recommendedAgeMonths: 6,  minAgeMonths: 6,  maxAgeMonths: null, displayOrder: 130 },
      { code: 'VIP_3',         name: 'Poliomielite (VIP)', description: 'Terceira dose da poliomielite inativada.', doseLabel: '3ª dose', doseNumber: 3, isBooster: false, recommendedAgeMonths: 6,  minAgeMonths: 6,  maxAgeMonths: null, displayOrder: 140 },

      // ===== 9 MESES =====
      { code: 'YF_1',          name: 'Febre Amarela',  description: 'Recomendada para todo o país a partir de 2020.', doseLabel: 'Dose inicial', doseNumber: 1, isBooster: false, recommendedAgeMonths: 9,  minAgeMonths: 9,  maxAgeMonths: null, displayOrder: 150 },

      // ===== 12 MESES =====
      { code: 'MMR_1',         name: 'Tríplice viral', description: 'Sarampo, caxumba e rubéola (SCR).', doseLabel: '1ª dose', doseNumber: 1, isBooster: false, recommendedAgeMonths: 12, minAgeMonths: 12, maxAgeMonths: null, displayOrder: 160 },
      { code: 'PCV10_BOOSTER', name: 'Pneumocócica 10v', description: 'Reforço da pneumocócica.', doseLabel: 'Reforço', doseNumber: 3, isBooster: true,  recommendedAgeMonths: 12, minAgeMonths: 12, maxAgeMonths: null, displayOrder: 170 },
      { code: 'MENC_BOOSTER',  name: 'Meningocócica C', description: 'Reforço da meningocócica.', doseLabel: 'Reforço', doseNumber: 3, isBooster: true,  recommendedAgeMonths: 12, minAgeMonths: 12, maxAgeMonths: null, displayOrder: 180 },

      // ===== 15 MESES =====
      { code: 'DTP_BOOSTER_1', name: 'DTP (reforço)',  description: 'Primeiro reforço da DTP (difteria, tétano e coqueluche).', doseLabel: '1º reforço', doseNumber: 4, isBooster: true, recommendedAgeMonths: 15, minAgeMonths: 15, maxAgeMonths: null, displayOrder: 190 },
      { code: 'VOP_BOOSTER_1', name: 'Poliomielite (VOP)', description: 'Reforço oral da poliomielite (gotinha).', doseLabel: '1º reforço', doseNumber: 4, isBooster: true, recommendedAgeMonths: 15, minAgeMonths: 15, maxAgeMonths: null, displayOrder: 200 },
      { code: 'HEPA',          name: 'Hepatite A',     description: 'Dose única contra Hepatite A.', doseLabel: 'Dose única', doseNumber: 1, isBooster: false, recommendedAgeMonths: 15, minAgeMonths: 15, maxAgeMonths: 60,   displayOrder: 210 },
      { code: 'MMR_2',         name: 'Tetra viral',    description: 'Sarampo, caxumba, rubéola e varicela.', doseLabel: '2ª dose (com varicela)', doseNumber: 2, isBooster: false, recommendedAgeMonths: 15, minAgeMonths: 15, maxAgeMonths: null, displayOrder: 220 },

      // ===== 4 ANOS (48 MESES) =====
      { code: 'DTP_BOOSTER_2', name: 'DTP (reforço)',  description: 'Segundo reforço da DTP.', doseLabel: '2º reforço', doseNumber: 5, isBooster: true, recommendedAgeMonths: 48, minAgeMonths: 48, maxAgeMonths: null, displayOrder: 230 },
      { code: 'VOP_BOOSTER_2', name: 'Poliomielite (VOP)', description: 'Segundo reforço oral da poliomielite.', doseLabel: '2º reforço', doseNumber: 5, isBooster: true, recommendedAgeMonths: 48, minAgeMonths: 48, maxAgeMonths: null, displayOrder: 240 },
      { code: 'VARICELA_BOOSTER', name: 'Varicela (reforço)', description: 'Reforço da varicela (catapora).', doseLabel: 'Reforço', doseNumber: 2, isBooster: true, recommendedAgeMonths: 48, minAgeMonths: 48, maxAgeMonths: null, displayOrder: 250 },
      { code: 'YF_BOOSTER',    name: 'Febre Amarela (reforço)', description: 'Reforço único da febre amarela.', doseLabel: 'Reforço', doseNumber: 2, isBooster: true, recommendedAgeMonths: 48, minAgeMonths: 48, maxAgeMonths: null, displayOrder: 260 },
    ];

    // INSERT em lote. Idempotente: se rodar 2x, o índice UNIQUE em `code`
    // impede duplicação (e a migration vai falhar — comportamento esperado
    // já que migrations não devem rodar 2x).
    for (const v of seeds) {
      await queryRunner.query(
        `
        INSERT INTO "vaccines"
          ("id", "code", "name", "description", "dose_label", "dose_number",
           "is_booster", "recommended_age_months", "min_age_months",
           "max_age_months", "display_order", "is_active")
        VALUES
          (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        `,
        [
          v.code,
          v.name,
          v.description,
          v.doseLabel,
          v.doseNumber,
          v.isBooster,
          v.recommendedAgeMonths,
          v.minAgeMonths,
          v.maxAgeMonths,
          v.displayOrder,
        ],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "vaccine_records"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "vaccines"`);
  }
}
