import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { Baby } from '../../babies/entities/baby.entity';
import { Family } from '../../families/entities/family.entity';

// Consulta médica agendada para um bebê. Suporta o ciclo completo:
// agendar → realizar (com notas) ou cancelar (com motivo) ou marcar como
// perdida (cron diário). Soft-delete mantém o histórico.
@Entity('appointments')
@Index('IDX_appointments_family_scheduled', ['familyId', 'scheduledAt'])
@Index('IDX_appointments_status', ['status'])
export class Appointment extends SoftDeletableEntity {
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
  title!: string;

  @Column({ name: 'doctor_name', type: 'varchar', length: 120, nullable: true })
  doctorName: string | null = null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  specialty: string | null = null;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null = null;

  @Column({ type: 'text', nullable: true })
  notes: string | null = null;

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.SCHEDULED })
  status: AppointmentStatus = AppointmentStatus.SCHEDULED;

  @Column({ name: 'reminder_enabled', type: 'boolean', default: true })
  reminderEnabled!: boolean;

  @Column({ name: 'reminder_minutes_before', type: 'int', default: 1440 })
  reminderMinutesBefore!: number;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null = null;

  @Column({ name: 'completed_notes', type: 'text', nullable: true })
  completedNotes: string | null = null;

  @Column({ name: 'canceled_at', type: 'timestamptz', nullable: true })
  canceledAt: Date | null = null;

  @Column({ name: 'cancel_reason', type: 'varchar', length: 200, nullable: true })
  cancelReason: string | null = null;

  // Setado pelo AppointmentsReminderJob (A8). Idempotência do cron de push.
  @Column({ name: 'notified_at', type: 'timestamptz', nullable: true })
  notifiedAt: Date | null = null;
}
