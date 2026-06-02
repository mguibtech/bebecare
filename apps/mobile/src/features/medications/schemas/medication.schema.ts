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

import { DoseUnit } from '../types';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const medicationSchema = z
  .object({
    name: z
      .string({ required_error: 'Nome obrigatorio' })
      .trim()
      .min(1, 'Nome obrigatorio')
      .max(120, 'Nome muito longo'),

    /**
     * Aceita string (input em RN) e converte pra number antes da validacao.
     */
    dose: z.preprocess(
      (v) => {
        if (v === '' || v === null || v === undefined) return undefined;
        const n = Number(v);
        return Number.isNaN(n) ? v : n;
      },
      z
        .number({
          required_error: 'Dose obrigatoria',
          invalid_type_error: 'Dose invalida',
        })
        .min(0.001, 'Dose minima 0.001')
        .max(99999.999, 'Dose muito alta'),
    ),

    doseUnit: z.nativeEnum(DoseUnit, {
      errorMap: () => ({ message: 'Unidade obrigatoria' }),
    }),

    instructions: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === '' ? undefined : v)),

    startDate: z
      .string({ required_error: 'Data de inicio obrigatoria' })
      .regex(dateRegex, 'Formato invalido (AAAA-MM-DD)'),

    endDate: z
      .string()
      .regex(dateRegex, 'Formato invalido (AAAA-MM-DD)')
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
      message: 'Data de fim deve ser depois da data de inicio',
      path: ['endDate'],
    },
  );

export type MedicationFormValues = z.infer<typeof medicationSchema>;

/**
 * Schema de UM schedule (linha do form de schedules).
 * O backend valida o bitmask 1-127; o form valida que array de dias
 * tem >=1 elemento (o componente converte pra mask depois).
 */
export const scheduleSchema = z.object({
  time: z
    .string({ required_error: 'Horario obrigatorio' })
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Horario invalido (HH:mm)'),

  days: z
    .array(z.string())
    .min(1, 'Selecione pelo menos um dia'),

  useAlarm: z.boolean().default(true),
});

export type ScheduleFormValues = z.infer<typeof scheduleSchema>;
