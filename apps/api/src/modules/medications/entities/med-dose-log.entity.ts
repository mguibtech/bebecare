import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { DoseStatus } from '../../../common/enums/dose-status.enum';
import { Baby } from '../../babies/entities/baby.entity';
import { Family } from '../../families/entities/family.entity';
import { User } from '../../users/entities/user.entity';
import { MedSchedule } from './med-schedule.entity';
import { Medication } from './medication.entity';

// Histórico de doses esperadas. Cron diário cria PENDING para cada
// schedule ativo do dia. Usuário pode marcar como TAKEN ou SKIPPED.
//
// Hard delete: doses são alta-frequência. Histórico longo importa pra adesão,
// mas registros muito antigos podem ser arquivados em job futuro.
@Entity('med_dose_logs')
@Index('IDX_med_dose_logs_baby_scheduled', ['babyId', 'scheduledFor'])
@Index('IDX_med_dose_logs_status', ['status'])
@Index('IDX_med_dose_logs_schedule_day_unique', ['scheduleId', 'scheduledFor'], {
  unique: true,
})
export class MedDoseLog extends BaseEntity {
  @Column({ name: 'medication_id', type: 'uuid' })
  medicationId!: string;

  @ManyToOne(() => Medication, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'medication_id' })
  medication!: Medication;

  @Column({ name: 'schedule_id', type: 'uuid' })
  scheduleId!: string;

  @ManyToOne(() => MedSchedule, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'schedule_id' })
  schedule!: MedSchedule;

  // Desnormalizado para queries rápidas ("doses de hoje da família")
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

  // Momento em que a dose deveria ser tomada (date + time do schedule)
  @Column({ name: 'scheduled_for', type: 'timestamptz' })
  scheduledFor!: Date;

  @Column({ type: 'enum', enum: DoseStatus, default: DoseStatus.PENDING })
  status: DoseStatus = DoseStatus.PENDING;

  @Column({ name: 'taken_at', type: 'timestamptz', nullable: true })
  takenAt: Date | null = null;

  @Column({ name: 'skip_reason', type: 'varchar', length: 200, nullable: true })
  skipReason: string | null = null;

  // Quem marcou (auditoria — útil em família compartilhada pra evitar dose dupla)
  @Column({ name: 'logged_by_user_id', type: 'uuid', nullable: true })
  loggedByUserId: string | null = null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'logged_by_user_id' })
  loggedByUser: User | null = null;
}
