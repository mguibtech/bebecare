/**
 * Tipos do dominio Despertadores (M7).
 *
 * Alarme PESSOAL (por usuario, nao por bebe): label + horario + dias da semana
 * + categoria. Modelo de despertador de celular — 1 horario por linha.
 *
 * Reutiliza os utilitarios de bitmask de dias da semana de medications/types
 * (genericos, ja existentes) pra nao duplicar.
 */

export {
  DAY_BITMASKS,
  DAY_LABELS,
  ALL_DAYS_MASK,
  WEEKDAYS_MASK,
  WEEKEND_MASK,
  daysFromMask,
  maskFromDays,
  type DayKey,
} from '@/features/medications/types';

export enum AlarmCategory {
  FEEDING = 'feeding',
  DIAPER = 'diaper',
  NAP = 'nap',
  CUSTOM = 'custom',
}

export const ALARM_CATEGORY_LABELS: Record<AlarmCategory, string> = {
  [AlarmCategory.FEEDING]: 'Mamada',
  [AlarmCategory.DIAPER]: 'Troca de fralda',
  [AlarmCategory.NAP]: 'Soneca',
  [AlarmCategory.CUSTOM]: 'Outro',
};

/** Icone (MaterialCommunityIcons) por categoria. */
export const ALARM_CATEGORY_ICONS: Record<AlarmCategory, string> = {
  [AlarmCategory.FEEDING]: 'baby-bottle-outline',
  [AlarmCategory.DIAPER]: 'human-baby-changing-table',
  [AlarmCategory.NAP]: 'sleep',
  [AlarmCategory.CUSTOM]: 'bell-outline',
};

export type Alarm = {
  id: string;
  userId: string;
  label: string;
  /** HH:mm 24h. */
  time: string;
  /** Bitmask 1-127. */
  daysOfWeekMask: number;
  category: AlarmCategory;
  /** Chave de som interno, ou null = som padrao. */
  soundKey: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateAlarmBody = {
  label: string;
  /** HH:mm */
  time: string;
  /** Bitmask 1-127. */
  daysOfWeekMask: number;
  category?: AlarmCategory;
  soundKey?: string;
  isActive?: boolean;
};

export type UpdateAlarmBody = Partial<CreateAlarmBody>;
