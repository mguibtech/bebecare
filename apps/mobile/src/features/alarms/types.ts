/**
 * Tipos do dominio Despertadores (M7).
 *
 * Alarme PESSOAL (por usuário, não por bebê): label + horário + dias da semana
 * + categoria. Modelo de despertador de celular — 1 horário por linha.
 *
 * Reutiliza os utilitarios de bitmask de dias da semana de medications/types
 * (genericos, já existentes) pra não duplicar.
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

/** Ícone (MaterialCommunityIcons) por categoria. */
export const ALARM_CATEGORY_ICONS: Record<AlarmCategory, string> = {
  [AlarmCategory.FEEDING]: 'baby-bottle-outline',
  [AlarmCategory.DIAPER]: 'human-baby-changing-table',
  [AlarmCategory.NAP]: 'sleep',
  [AlarmCategory.CUSTOM]: 'bell-outline',
};

/** Opções de intervalo (horas) oferecidas no form. Divisores de 24. */
export const INTERVAL_OPTIONS = [2, 3, 4, 6] as const;

export type Alarm = {
  id: string;
  userId: string;
  label: string;
  /** HH:mm 24h. No modo intervalo, e o horário de INICIO. */
  time: string;
  /** Bitmask 1-127. */
  daysOfWeekMask: number;
  category: AlarmCategory;
  /**
   * Modo intervalo: toca a cada N horas a partir de `time` (24h).
   * null = horário unico (toca so em `time`).
   */
  intervalHours: number | null;
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
  /** A cada N horas (2/3/4/6); omitir = horário unico. */
  intervalHours?: number | null;
  soundKey?: string;
  isActive?: boolean;
};

export type UpdateAlarmBody = Partial<CreateAlarmBody>;
