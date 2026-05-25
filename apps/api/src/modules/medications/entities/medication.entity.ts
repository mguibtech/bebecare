import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { DoseUnit } from '../../../common/enums/dose-unit.enum';
import { Baby } from '../../babies/entities/baby.entity';
import { Family } from '../../families/entities/family.entity';
import { MedSchedule } from './med-schedule.entity';

// Um remédio prescrito para o bebê. O período de uso é controlado por
// startDate/endDate; horários são MedSchedules separados (1:N) — um remédio
// pode ter múltiplos horários por dia (ex.: 8h, 14h, 20h).
@Entity('medications')
@Index('IDX_medications_baby_active', ['babyId', 'isActive'])
export class Medication extends SoftDeletableEntity {
  @Column({ name: 'baby_id', type: 'uuid' })
  babyId!: string;

  @ManyToOne(() => Baby, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'baby_id' })
  baby!: Baby;

  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => Family, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'family_id' })
  family!: Family;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  // Valor numérico da dose. Ex.: 5 (ml), 1 (gota), 400 (mg).
  // numeric pra suportar frações (ex.: 2.5 ml).
  @Column({ type: 'numeric', precision: 10, scale: 3 })
  dose!: string; // pg driver retorna numeric como string

  @Column({ name: 'dose_unit', type: 'enum', enum: DoseUnit })
  doseUnit!: DoseUnit;

  // Instruções extras: "Junto com leite", "Após o banho"
  @Column({ type: 'text', nullable: true })
  instructions: string | null = null;

  // Período do tratamento. endDate nulo = uso contínuo.
  @Column({ name: 'start_date', type: 'date' })
  startDate!: string; // YYYY-MM-DD

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: string | null = null;

  // Permite pausar sem deletar (volta a gerar dose logs quando reativado).
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => MedSchedule, (s) => s.medication)
  schedules!: MedSchedule[];
}
