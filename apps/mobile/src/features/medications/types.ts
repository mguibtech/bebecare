/**
 * Tipos do dominio Medications.
 *
 * 3 entidades principais:
 *  - Medication: o remédio em si (Vitamina D, 400 gotas, vence em 3 meses)
 *  - MedSchedule: cronograma de doses (horário + dias da semana via bitmask)
 *  - MedDoseLog: dose esperada num horário específico (status PENDING/TAKEN/SKIPPED)
 *
 * O backend tem um cron que cria DoseLogs diarios baseado nos schedules
 * ativos. Mobile soh consome.
 */

// ============================================================
// Enums
// ============================================================

export enum DoseStatus {
  PENDING = 'pending',
  TAKEN = 'taken',
  SKIPPED = 'skipped',
}

export enum DoseUnit {
  DROP = 'drop',
  ML = 'ml',
  MG = 'mg',
  TABLET = 'tablet',
  SACHET = 'sachet',
}

/** Unidade de dose -> chave i18n do label (resolver com t() / i18n.t()). */
export const DOSE_UNIT_KEYS = {
  [DoseUnit.DROP]: 'meds.unitDrop',
  [DoseUnit.ML]: 'meds.unitMl',
  [DoseUnit.MG]: 'meds.unitMg',
  [DoseUnit.TABLET]: 'meds.unitTablet',
  [DoseUnit.SACHET]: 'meds.unitSachet',
} as const;

// ============================================================
// MedSchedule
// ============================================================

export type MedSchedule = {
  id: string;
  /** HH:mm formato 24h. */
  time: string;
  /** Bitmask 7 bits — usar daysFromMask pra converter. */
  daysOfWeekMask: number;
  /**
   * @deprecated Vem do backend em pt fixo. O mobile agora deriva os dias da
   * `daysOfWeekMask` e localiza no cliente (DAY_KEYS) — não consumir. Remover
   * quando o backend parar de enviar (cluster 4 de i18n).
   */
  daysOfWeekNames: string[];
  /**
   * true = alarme local via notifee (mais confiavel em devices Android com
   * battery optimization agressivo). false = push notification regular.
   */
  useAlarm: boolean;
  isActive: boolean;
};

export type CreateMedScheduleBody = {
  /** HH:mm */
  time: string;
  /** Bitmask 1-127. */
  daysOfWeekMask: number;
  useAlarm?: boolean;
  isActive?: boolean;
};

export type UpdateMedScheduleBody = Partial<CreateMedScheduleBody>;

// ============================================================
// Medication
// ============================================================

export type Medication = {
  id: string;
  babyId: string;
  familyId: string;
  name: string;
  /** Vem como string (decimal Postgres). Parse com Number() antes de operar. */
  dose: string;
  doseUnit: DoseUnit;
  instructions: string | null;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD ou null (continuo). */
  endDate: string | null;
  isActive: boolean;
  schedules: MedSchedule[];
  createdAt: string;
  updatedAt: string;
};

export type CreateMedicationBody = {
  name: string;
  dose: number;
  doseUnit: DoseUnit;
  instructions?: string;
  /** YYYY-MM-DD */
  startDate: string;
  endDate?: string;
  isActive?: boolean;
};

export type UpdateMedicationBody = Partial<CreateMedicationBody>;

// ============================================================
// MedDoseLog
// ============================================================

/** Versao "embedded" do medicamento dentro do dose log. */
export type DoseLogMedication = {
  id: string;
  name: string;
  dose: string;
  doseUnit: DoseUnit;
  instructions: string | null;
};

export type MedDoseLog = {
  id: string;
  babyId: string;
  familyId: string;
  scheduleId: string;
  medication: DoseLogMedication;
  /** ISO date-time. */
  scheduledFor: string;
  status: DoseStatus;
  /** ISO date-time. Preenchido quando status=TAKEN. */
  takenAt: string | null;
  /** Motivo do skip (max 200). */
  skipReason: string | null;
  loggedByUserId: string | null;
  loggedByName: string | null;
};

export type SkipDoseBody = {
  reason?: string;
};

export type DoseLogFilter = {
  status?: DoseStatus;
  /** ISO date-time. */
  from?: string;
  /** ISO date-time. */
  to?: string;
};

// ============================================================
// Dias da semana — utilitarios bitmask
// ============================================================

/**
 * Ordem (do backend): dom=1, seg=2, ter=4, qua=8, qui=16, sex=32, sab=64.
 * 127 = todos os dias. 62 = dias uteis (seg a sex). 65 = fim de semana.
 */
export const DAY_BITMASKS = {
  sun: 1,
  mon: 2,
  tue: 4,
  wed: 8,
  thu: 16,
  fri: 32,
  sat: 64,
} as const;

export type DayKey = keyof typeof DAY_BITMASKS;

/** DayKey -> chave i18n da abreviação (resolver com t()). */
export const DAY_KEYS = {
  sun: 'days.sun',
  mon: 'days.mon',
  tue: 'days.tue',
  wed: 'days.wed',
  thu: 'days.thu',
  fri: 'days.fri',
  sat: 'days.sat',
} as const;

export const ALL_DAYS_MASK = 127;
export const WEEKDAYS_MASK = 62; // seg a sex
export const WEEKEND_MASK = 65; // dom + sab

/** Converte bitmask em array de DayKey. */
export function daysFromMask(mask: number): DayKey[] {
  return (Object.keys(DAY_BITMASKS) as DayKey[]).filter(
    // eslint-disable-next-line no-bitwise -- backend usa bitmask propositalmente pra daysOfWeek
    (day) => (mask & DAY_BITMASKS[day]) !== 0,
  );
}

/** Converte array de DayKey em bitmask. */
export function maskFromDays(days: DayKey[]): number {
  // eslint-disable-next-line no-bitwise -- backend usa bitmask propositalmente pra daysOfWeek
  return days.reduce((acc, day) => acc | DAY_BITMASKS[day], 0);
}
