/**
 * Tipos do dominio Babies no mobile, espelhando os DTOs do backend
 * (apps/api/src/modules/babies/dto/*.ts).
 *
 * Manter em sincronia com:
 *  - CreateBabyDto / UpdateBabyDto / BabyResponseDto
 *  - enums Sex, BloodType, AvatarStyle
 */

import { AvatarStyle } from '@/features/auth/types';

// ============================================================
// Enums (espelhos do backend)
// ============================================================

/** Sexo biologico do bebê — usado em curvas OMS por sexo, iconografia. */
export enum Sex {
  MALE = 'male',
  FEMALE = 'female',
}

/** Tipo sanguineo (ABO+Rh). Null no DB quando ainda não se sabe. */
export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
}

// Re-export pra evitar import duplicado em quem usa baby + avatar.
export { AvatarStyle };

// ============================================================
// Response (GET / POST / PATCH /babies)
// ============================================================

/**
 * Resposta pública do bebê. Inclui idade calculada (months + days)
 * que o backend faz uma vez por response — frontend NAO recalcula
 * (evita drift e fuso horário).
 *
 * birthHeightCm vem como string (decimal Postgres "49.50") — converter
 * pra Number na hora de exibir ou comparar.
 */
export type Baby = {
  id: string;
  familyId: string;
  name: string;
  sex: Sex;
  /** Formato YYYY-MM-DD (sem horário). */
  birthDate: string;
  /** Idade em meses inteiros (ex: 9). */
  ageMonths: number;
  /** Idade total em dias (ex: 274). */
  ageDays: number;
  birthWeightGrams: number | null;
  /** Vem como string (decimal). Parse com Number() antes de operar. */
  birthHeightCm: string | null;
  bloodType: BloodType | null;
  allergies: string | null;
  eyeColor: string | null;
  notes: string | null;
  avatarStyle: AvatarStyle;
  avatarSeed: string;
  /** ISO date-time. */
  createdAt: string;
  /** ISO date-time. */
  updatedAt: string;
};

// ============================================================
// Bodies (request)
// ============================================================

export type CreateBabyBody = {
  name: string;
  sex: Sex;
  /** YYYY-MM-DD */
  birthDate: string;

  // Opcionais
  birthWeightGrams?: number;
  birthHeightCm?: number;
  bloodType?: BloodType;
  allergies?: string;
  eyeColor?: string;
  notes?: string;
  avatarStyle?: AvatarStyle;
  avatarSeed?: string;
};

/** Update aceita qualquer subset do CreateBaby. */
export type UpdateBabyBody = Partial<CreateBabyBody>;

// ============================================================
// Labels de UI
// ============================================================

/**
 * Tipo sanguíneo é universal (A+, O-…) — não localiza. Sexo, estilos de avatar
 * e demais textos são localizados via i18n nos componentes (t('babies.*')).
 */
export const BLOOD_TYPE_LABELS: Record<BloodType, string> = {
  [BloodType.A_POSITIVE]: 'A+',
  [BloodType.A_NEGATIVE]: 'A-',
  [BloodType.B_POSITIVE]: 'B+',
  [BloodType.B_NEGATIVE]: 'B-',
  [BloodType.AB_POSITIVE]: 'AB+',
  [BloodType.AB_NEGATIVE]: 'AB-',
  [BloodType.O_POSITIVE]: 'O+',
  [BloodType.O_NEGATIVE]: 'O-',
};
