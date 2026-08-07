/**
 * Schemas zod do form de bebê.
 *
 * Validacoes batem com o backend (CreateBabyDto):
 *  - name: 1-120 chars
 *  - birthDate: YYYY-MM-DD, não no futuro
 *  - birthWeightGrams: 300-8000 (inteiro)
 *  - birthHeightCm: 20-70 (2 decimais)
 *  - allergies: ate 500 chars
 *  - eyeColor: ate 30 chars
 *  - avatarSeed: ate 100 chars
 *
 * Mensagens em PT-BR — exibidas direto no form.
 */

import { z } from 'zod';
import type { TFunction } from 'i18next';

import { parseNumericInput } from '../../../shared/utils/number';
import { AvatarStyle, BloodType, Sex } from '../types';

/**
 * Factory do schema do form de bebê (recebe `t` pra mensagens i18n).
 * Campos opcionais aceitam undefined — o Form converte string vazia em
 * undefined antes de submeter.
 */
export function makeBabySchema(t: TFunction) {
  return z.object({
    name: z
      .string({ required_error: t('validation.nameRequired') })
      .trim()
      .min(1, t('validation.nameRequired'))
      .max(120, t('validation.nameTooLong')),

    sex: z.nativeEnum(Sex, {
      errorMap: () => ({ message: t('validation.sexRequired') }),
    }),

    // Dois refines separados de propósito: uma data impossível ("2026-13-40")
    // passa no regex de máscara, e um refine único acusaria "não pode ser no
    // futuro" — mensagem enganosa. O primeiro pega a data inválida.
    birthDate: z
      .string({ required_error: t('validation.birthDateRequired') })
      .regex(/^\d{4}-\d{2}-\d{2}$/, t('validation.dateFormat'))
      .refine((s) => !Number.isNaN(new Date(s + 'T00:00:00').getTime()), {
        message: t('validation.birthDateInvalid'),
      })
      .refine(
        (s) => {
          const parsed = new Date(s + 'T00:00:00');
          return Number.isNaN(parsed.getTime()) || parsed <= new Date();
        },
        { message: t('validation.birthDateFuture') },
      ),

    /**
     * Number forms em RN chegam como string. `parseNumericInput` converte
     * string vazia para undefined (campo opcional) e aceita vírgula decimal.
     */
    birthWeightGrams: z.preprocess(
      parseNumericInput,
      z
        .number({ invalid_type_error: t('validation.weightInvalid') })
        .int(t('validation.weightInteger'))
        .min(300, t('validation.weightMin'))
        .max(8000, t('validation.weightMax'))
        .optional(),
    ),

    birthHeightCm: z.preprocess(
      parseNumericInput,
      z
        .number({ invalid_type_error: t('validation.heightInvalid') })
        .min(20, t('validation.heightMin'))
        .max(70, t('validation.heightMax'))
        .optional(),
    ),

    bloodType: z.nativeEnum(BloodType).optional(),

    allergies: z
      .string()
      .trim()
      .max(500, t('validation.max500'))
      .optional()
      .transform((v) => (v === '' ? undefined : v)),

    eyeColor: z
      .string()
      .trim()
      .max(30, t('validation.max30'))
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
      .max(100, t('validation.max100'))
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
  });
}

export type CreateBabyFormValues = z.infer<ReturnType<typeof makeBabySchema>>;
