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

import { REMINDER_OPTIONS } from '../types';

const reminderValues = REMINDER_OPTIONS.map((o) => o.value) as [
  number,
  ...number[],
];

export const appointmentSchema = z.object({
  title: z
    .string({ required_error: 'Título obrigatório' })
    .trim()
    .min(1, 'Título obrigatório')
    .max(120, 'Título muito longo'),

  doctorName: z
    .string()
    .trim()
    .max(120, 'Nome muito longo')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  specialty: z
    .string()
    .trim()
    .max(80, 'Especialidade muito longa')
    .optional()
    .transform((v) => (v === '' ? undefined : v)),

  scheduledAt: z
    .string({ required_error: 'Data e hora obrigatórias' })
    .min(1, 'Data e hora obrigatórias')
    // ISO 8601 basico (validar mais a fundo seria overkill).
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/,
      'Data e hora invalidas',
    ),

  location: z
    .string()
    .trim()
    .max(200, 'Local muito longo')
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
      message: 'Opcao de lembrete inválida',
    })
    .default(1440),
});

export type AppointmentFormValues = z.infer<typeof appointmentSchema>;
