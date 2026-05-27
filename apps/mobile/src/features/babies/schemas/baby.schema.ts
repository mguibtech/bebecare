/**
 * Schemas zod do form de bebe.
 *
 * Validacoes batem com o backend (CreateBabyDto):
 *  - name: 1-120 chars
 *  - birthDate: YYYY-MM-DD, nao no futuro
 *  - birthWeightGrams: 300-8000 (inteiro)
 *  - birthHeightCm: 20-70 (2 decimais)
 *  - allergies: ate 500 chars
 *  - eyeColor: ate 30 chars
 *  - avatarSeed: ate 100 chars
 *
 * Mensagens em PT-BR — exibidas direto no form.
 */

import { z } from 'zod';

import { AvatarStyle, BloodType, Sex } from '../types';

/** Helper: valida data ISO YYYY-MM-DD e que nao seja no futuro. */
const birthDateSchema = z
  .string({ required_error: 'Data de nascimento obrigatoria' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato invalido (use AAAA-MM-DD)')
  .refine(
    (s) => {
      const parsed = new Date(s + 'T00:00:00');
      return !Number.isNaN(parsed.getTime()) && parsed <= new Date();
    },
    { message: 'Data de nascimento nao pode ser no futuro' },
  );

/**
 * Schema do form de criacao. Os campos opcionais aceitam undefined
 * — o componente Form converte string vazia em undefined antes de submeter.
 */
export const createBabySchema = z.object({
  name: z
    .string({ required_error: 'Nome obrigatorio' })
    .trim()
    .min(1, 'Nome obrigatorio')
    .max(120, 'Nome muito longo'),

  sex: z.nativeEnum(Sex, {
    errorMap: () => ({ message: 'Sexo obrigatorio' }),
  }),

  birthDate: birthDateSchema,

  /**
   * Number forms em RN chegam como string. preprocess converte string vazia
   * para undefined (campo opcional) e strings numericas para Number.
   * NaN cai no z.number() validation que rejeita.
   */
  birthWeightGrams: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    z
      .number({ invalid_type_error: 'Peso invalido' })
      .int('Peso em gramas (inteiro)')
      .min(300, 'Peso minimo 300g')
      .max(8000, 'Peso maximo 8000g')
      .optional(),
  ),

  birthHeightCm: z.preprocess(
    (v) => {
      if (v === '' || v === null || v === undefined) return undefined;
      const n = Number(v);
      return Number.isNaN(n) ? v : n;
    },
    z
      .number({ invalid_type_error: 'Altura invalida' })
      .min(20, 'Altura minima 20cm')
      .max(70, 'Altura maxima 70cm')
      .optional(),
  ),

  bloodType: z.nativeEnum(BloodType).optional(),

  allergies: z
    .string()
    .trim()
    .max(500, 'Maximo 500 caracteres')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  eyeColor: z
    .string()
    .trim()
    .max(30, 'Maximo 30 caracteres')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  notes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  avatarStyle: z.nativeEnum(AvatarStyle).optional(),

  avatarSeed: z
    .string()
    .trim()
    .max(100, 'Maximo 100 caracteres')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export type CreateBabyFormValues = z.infer<typeof createBabySchema>;

/** Para edicao, mesmo schema mas todos campos opcionais. */
export const updateBabySchema = createBabySchema.partial();
export type UpdateBabyFormValues = z.infer<typeof updateBabySchema>;
