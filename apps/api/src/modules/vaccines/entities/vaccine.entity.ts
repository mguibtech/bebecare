import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

// Catálogo PNI — uma linha por dose específica de cada vacina (ex.: PENTA_1,
// PENTA_2, PENTA_3 são entradas distintas). O catálogo é populado via migration
// de seed e é COMPARTILHADO entre todos os usuários (não pertence a família).
//
// Atualizações futuras do PNI: criar nova migration que faz UPDATE/INSERT.
@Entity('vaccines')
export class Vaccine extends BaseEntity {
  // Identificador estável usado pelo seed (não trocar). Ex.: 'BCG', 'PENTA_1'.
  @Index('IDX_vaccines_code_unique', { unique: true })
  @Column({ type: 'varchar', length: 50 })
  code!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description: string | null = null;

  // Rótulo amigável da dose: "Dose única", "1ª dose", "Reforço".
  @Column({ name: 'dose_label', type: 'varchar', length: 50 })
  doseLabel!: string;

  // Número ordinal da dose (1, 2, 3...). Sentido só dentro da mesma vacina.
  @Column({ name: 'dose_number', type: 'int' })
  doseNumber!: number;

  @Column({ name: 'is_booster', type: 'boolean', default: false })
  isBooster!: boolean;

  // Idade recomendada para a dose (em meses).
  @Column({ name: 'recommended_age_months', type: 'int' })
  recommendedAgeMonths!: number;

  // Idade mínima permitida (na maioria igual à recomendada).
  @Column({ name: 'min_age_months', type: 'int' })
  minAgeMonths!: number;

  // Idade máxima — opcional (ex.: rotavírus tem janela fechada).
  @Column({ name: 'max_age_months', type: 'int', nullable: true })
  maxAgeMonths: number | null = null;

  // Ordem de exibição global (controla a sequência no app).
  @Column({ name: 'display_order', type: 'int', default: 0 })
  displayOrder!: number;

  // Permite ocultar vacinas obsoletas sem deletar (futuro).
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
