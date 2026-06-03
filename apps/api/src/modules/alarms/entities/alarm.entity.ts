import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { AlarmCategory } from '../../../common/enums/alarm-category.enum';
import { User } from '../../users/entities/user.entity';

// Despertador pessoal (M7 — mamada / troca / soneca / custom).
//
// Diferente das medicações (que são por bebê/família, com dose logs), o
// despertador é PESSOAL: cada usuário gerencia os seus, no modelo de um alarme
// de celular — um horário + dias da semana por linha. Vários horários = várias
// linhas. O mobile reusa toda a stack de alarme local (notifee) do M6.
//
// `daysOfWeekMask`: bitmask 7 bits (dom=1, seg=2, ter=4, qua=8, qui=16,
// sex=32, sáb=64). 127 = todos os dias.
@Entity('alarms')
@Index('IDX_alarms_user_active', ['userId', 'isActive'])
export class Alarm extends SoftDeletableEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ type: 'varchar', length: 80 })
  label!: string;

  // Hora do dia em HH:mm (string pra evitar confusão de timezone) — mesmo
  // padrão do MedSchedule.
  @Column({ type: 'varchar', length: 5 })
  time!: string;

  @Column({ name: 'days_of_week_mask', type: 'int', default: 127 })
  daysOfWeekMask!: number;

  // Modo intervalo (M7): se preenchido (ex: 3), o despertador toca a cada N
  // horas a partir de `time`, cobrindo 24h (ex: 06:00 → 06/09/12/15/18/21/00/03).
  // null = horário único (toca só em `time`). O mobile expande os disparos.
  @Column({ name: 'interval_hours', type: 'int', nullable: true })
  intervalHours: number | null = null;

  @Column({ type: 'enum', enum: AlarmCategory, default: AlarmCategory.CUSTOM })
  category: AlarmCategory = AlarmCategory.CUSTOM;

  // Chave de um som interno do pacote (escolhida no mobile). null = som padrão
  // do canal de alarme. Som customizado por arquivo do device fica pra depois.
  @Column({ name: 'sound_key', type: 'varchar', length: 60, nullable: true })
  soundKey: string | null = null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive!: boolean;
}
