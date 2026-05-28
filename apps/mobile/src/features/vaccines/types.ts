/**
 * Tipos do dominio Vaccines no mobile, espelhando os DTOs do backend.
 *  - VaccineCatalogItemDto, BabyVaccineScheduleDto, ScheduleEntryDto,
 *    CreateVaccineRecordDto, VaccineRecordResponseDto
 *  - VaccineStatus enum
 *
 * Status (calculado no backend, NAO recalcular no mobile):
 *  - APPLIED  ja tomou (existe VaccineRecord)
 *  - OVERDUE  passou da idade recomendada + 6m tolerancia
 *  - DUE      esta no prazo agora
 *  - UPCOMING ainda nao atingiu idade minima
 */

// ============================================================
// Enum
// ============================================================

export enum VaccineStatus {
  APPLIED = 'applied',
  OVERDUE = 'overdue',
  DUE = 'due',
  UPCOMING = 'upcoming',
}

export const VACCINE_STATUS_LABELS: Record<VaccineStatus, string> = {
  [VaccineStatus.APPLIED]: 'Aplicada',
  [VaccineStatus.OVERDUE]: 'Atrasada',
  [VaccineStatus.DUE]: 'No prazo',
  [VaccineStatus.UPCOMING]: 'Em breve',
};

// ============================================================
// Catalogo PNI
// ============================================================

/** Item do catalogo PNI — uma "linha" de uma dose especifica. */
export type Vaccine = {
  id: string;
  /** Codigo curto (ex: 'PENTA_1'). */
  code: string;
  /** Nome (ex: 'Pentavalente'). */
  name: string;
  description: string | null;
  /** Label da dose (ex: '1ª dose', 'Reforço'). */
  doseLabel: string;
  /** Numero da dose nessa serie (1, 2, 3...). */
  doseNumber: number;
  /** True se eh um reforco. */
  isBooster: boolean;
  /** Idade recomendada em meses. */
  recommendedAgeMonths: number;
  /** Idade minima (alguns sao 0 = ao nascer). */
  minAgeMonths: number;
  /** Idade maxima (null = sem limite). */
  maxAgeMonths: number | null;
  /** Ordem de exibicao no calendario (do PNI). */
  displayOrder: number;
};

// ============================================================
// Schedule do bebe
// ============================================================

/** Entrada do schedule: uma dose com status calculado pelo backend. */
export type ScheduleEntry = {
  vaccine: Vaccine;
  status: VaccineStatus;
  /** YYYY-MM-DD se aplicada, null caso contrario. */
  appliedAt: string | null;
  /** UUID do VaccineRecord se aplicada. */
  recordId: string | null;
  /** Data aproximada esperada (birthDate + recommendedAgeMonths). YYYY-MM-DD. */
  expectedAt: string;
};

/** Resposta de GET /babies/:babyId/vaccine-schedule. */
export type BabyVaccineSchedule = {
  babyId: string;
  babyName: string;
  babyAgeMonths: number;
  /**
   * Doses agrupadas por status no backend (ordem: overdue → due → upcoming → applied).
   * Mobile re-agrupa por idade pra UI via utils/groupByAge.
   */
  entries: ScheduleEntry[];
  /** Util pra badge de "atrasadas" na tab Vacinas. */
  summary: Record<VaccineStatus, number>;
};

// ============================================================
// VaccineRecord (aplicacao registrada)
// ============================================================

export type VaccineRecord = {
  id: string;
  babyId: string;
  familyId: string;
  vaccine: Vaccine;
  /** YYYY-MM-DD */
  appliedAt: string;
  lotNumber: string | null;
  location: string | null;
  notes: string | null;
  /** ISO date-time */
  createdAt: string;
};

// ----- Bodies (request) -----

export type CreateVaccineRecordBody = {
  vaccineId: string;
  /** YYYY-MM-DD */
  appliedAt: string;
  lotNumber?: string;
  location?: string;
  notes?: string;
};

export type UpdateVaccineRecordBody = Partial<
  Omit<CreateVaccineRecordBody, 'vaccineId'>
>;
