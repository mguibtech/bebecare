/**
 * Schemas zod do form de medicamento.
 *
 * Validacoes alinhadas com CreateMedicationDto do backend:
 *  - name: 1-120
 *  - dose: 0.001 - 99999.999 (3 decimais)
 *  - doseUnit: enum DoseUnit
 *  - startDate: YYYY-MM-DD
 *  - endDate?: YYYY-MM-DD (opcional, omite pra continuo)
 */

import { z } from 'zod';
import type { TFunction } from 'i18next';

import { DoseUnit } from '../types';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export function makeMedicationSchema(t: TFunction) {
  return z
    .object({
      name: z
        .string({ required_error: t('validation.nameRequired') })
        .trim()
        .min(1, t('validation.nameRequired'))
        .max(120, t('validation.nameTooLong')),

      /** Aceita string (input em RN) e converte pra number antes da validacao. */
      dose: z.preprocess(
        (v) => {
          if (v === '' || v === null || v === undefined) return undefined;
          const n = Number(v);
          return Number.isNaN(n) ? v : n;
        },
        z
          .number({
            required_error: t('validation.doseRequired'),
            invalid_type_error: t('validation.doseInvalid'),
          })
          .min(0.001, t('validation.doseMin'))
          .max(99999.999, t('validation.doseMax')),
      ),

      doseUnit: z.nativeEnum(DoseUnit, {
        errorMap: () => ({ message: t('validation.unitRequired') }),
      }),

      instructions: z
        .string()
        .trim()
        .optional()
        .transform((v) => (v === '' ? undefined : v)),

      startDate: z
        .string({ required_error: t('validation.startDateRequired') })
        .regex(dateRegex, t('validation.dateFormat')),

      endDate: z
        .string()
        .regex(dateRegex, t('validation.dateFormat'))
        .optional()
        .or(z.literal(''))
        .transform((v) => (v === '' ? undefined : v)),

      isActive: z.boolean().default(true),
    })
    .refine(
      (data) => {
        if (!data.endDate) return true;
        return data.endDate >= data.startDate;
      },
      {
        message: t('validation.endAfterStart'),
        path: ['endDate'],
      },
    );
}

export type MedicationFormValues = z.infer<
  ReturnType<typeof makeMedicationSchema>
>;
