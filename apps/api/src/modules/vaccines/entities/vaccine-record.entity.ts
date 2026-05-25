import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Baby } from '../../babies/entities/baby.entity';
import { Family } from '../../families/entities/family.entity';
import { Vaccine } from './vaccine.entity';

// Registro de uma dose aplicada a um bebê. Hard delete: se a família soft-deletar
// um bebê (ou o próprio bebê excluir um registro errado), tudo bem perder.
// familyId é desnormalizado para acelerar consultas comuns ("doses da minha família").
@Entity('vaccine_records')
@Index('IDX_vaccine_records_baby_vaccine_unique', ['babyId', 'vaccineId'], {
  unique: true,
})
@Index('IDX_vaccine_records_family_id', ['familyId'])
@Index('IDX_vaccine_records_applied_at', ['appliedAt'])
export class VaccineRecord extends BaseEntity {
  @Column({ name: 'baby_id', type: 'uuid' })
  babyId!: string;

  @ManyToOne(() => Baby, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'baby_id' })
  baby!: Baby;

  @Column({ name: 'vaccine_id', type: 'uuid' })
  vaccineId!: string;

  @ManyToOne(() => Vaccine, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'vaccine_id' })
  vaccine!: Vaccine;

  // Desnormalizado para queries rápidas ("doses da minha família") sem JOIN.
  // Mantido consistente porque Baby não muda de família na V1.
  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => Family, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_id' })
  family!: Family;

  @Column({ name: 'applied_at', type: 'date' })
  appliedAt!: string; // 'YYYY-MM-DD'

  @Column({ name: 'lot_number', type: 'varchar', length: 50, nullable: true })
  lotNumber: string | null = null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null = null;

  @Column({ type: 'text', nullable: true })
  notes: string | null = null;
}
