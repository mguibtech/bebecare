/**
 * Schema zod do form de consulta.
 *
 * Validacoes batem com CreateAppointmentDto do backend:
 *  - title: 1-120
 *  - doctorName: ate 120
 *  - specialty: ate 80
 *  - scheduledAt: ISO 8601 com timezone
 *  - location: ate 200
 *  - reminderMinutesBefore: 30 | 60 | 180 | 1440 | 10080
 */

import { z } from 'zod';
import type { TFunction } from 'i18next';

import { REMINDER_OPTIONS } from '../types';

const reminderValues = REMINDER_OPTIONS.map((o) => o.value) as [
  number,
  ...number[],
];

export function makeAppointmentSchema(t: TFunction) {
  return z.object({
    title: z
      .string({ required_error: t('validation.titleRequired') })
      .trim()
      .min(1, t('validation.titleRequired'))
      .max(120, t('validation.titleTooLong')),

    doctorName: z
      .string()
      .trim()
      .max(120, t('validation.nameTooLong'))
      .optional()
      .transform((v) => (v === '' ? undefined : v)),

    specialty: z
      .string()
      .trim()
      .max(80, t('validation.specialtyTooLong'))
      .optional()
      .transform((v) => (v === '' ? undefined : v)),

    scheduledAt: z
      .string({ required_error: t('validation.dateTimeRequired') })
      .min(1, t('validation.dateTimeRequired'))
      // ISO 8601 basico (validar mais a fundo seria overkill).
      .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, t('validation.dateTimeInvalid')),

    location: z
      .string()
      .trim()
      .max(200, t('validation.locationTooLong'))
      .optional()
      .transform((v) => (v === '' ? undefined : v)),

    notes: z
      .string()
      .trim()
      .optional()
      .transform((v) => (v === '' ? undefined : v)),

    reminderEnabled: z.boolean().default(true),

    reminderMinutesBefore: z
      .number()
      .refine((v) => reminderValues.includes(v), {
        message: t('validation.reminderInvalid'),
      })
      .default(1440),
  });
}

export type AppointmentFormValues = z.infer<
  ReturnType<typeof makeAppointmentSchema>
>;
