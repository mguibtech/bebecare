import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Medication } from './medication.entity';

// Horário de um remédio. Um remédio pode ter N schedules (ex.: 8h, 14h, 20h).
// `daysOfWeekMask` é um bitmask 7 bits (dom=1, seg=2, ter=4, ..., sáb=64).
// 127 = todos os dias. 62 = só dias úteis. Ver days-of-week.util.ts.
//
// `useAlarm` controla o tipo de notificação no mobile:
//  - true: notifee canal 'alarm' + full-screen intent (despertador "eficaz")
//  - false: notificação push regular
//
// Hard delete: schedules são efêmeros. Para histórico, a referência fica no MedDoseLog.
@Entity('med_schedules')
@Index('IDX_med_schedules_medication_id', ['medicationId'])
export class MedSchedule extends BaseEntity {
  @Column({ name: 'medication_id', type: 'uuid' })
  medicationId!: string;

  @ManyToOne(() => Medication, (m) => m.schedules, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'medication_id' })
  medication!: Medication;

  // Hora do dia em formato HH:mm (string pra evitar confusão de timezone).
  @Column({ type: 'varchar', length: 5 })
  time!: string;

  @Column({ name: 'days_of_week_mask', type: 'int', default: 127 })
  daysOfWeekMask!: number;

  @Column({ name: 'use_alarm', type: 'boolean', default: true })
  useAlarm!: boolean;

  // Permite pausar um horário específico sem deletar (ex.: trocou o regime
  // temporariamente). Quando false, cron não cria logs PENDING pra ele.
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
