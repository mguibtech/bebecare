/**
 * Tipos do dominio Appointments, espelhando DTOs do backend.
 *
 * Status (calculado/transicionado no backend):
 *  - SCHEDULED: agendada, ainda nao chegou ou recem-passou
 *  - COMPLETED: realizada (user marcou apos a consulta)
 *  - CANCELED:  cancelada manualmente
 *  - MISSED:    cron detectou >24h sem completar/cancelar
 *
 * Mobile NAO calcula status — soh renderiza o que vem.
 */

// ============================================================
// Enums
// ============================================================

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
  MISSED = 'missed',
}

/** Atalho de filtro do backend pra agrupar consultas. */
export type AppointmentScope = 'upcoming' | 'past' | 'all';

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: 'Agendada',
  [AppointmentStatus.COMPLETED]: 'Realizada',
  [AppointmentStatus.CANCELED]: 'Cancelada',
  [AppointmentStatus.MISSED]: 'Perdida',
};

/**
 * Opcoes de "minutos antes" do lembrete. Backend aceita qualquer inteiro,
 * mas o mobile soh oferece essas (alinhado com REMINDER_OPTIONS do backend).
 */
export const REMINDER_OPTIONS = [
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 180, label: '3 horas antes' },
  { value: 1440, label: '1 dia antes' },
  { value: 10080, label: '1 semana antes' },
] as const;

export type ReminderMinutes = (typeof REMINDER_OPTIONS)[number]['value'];

// ============================================================
// Response (GET / POST / PATCH /appointments)
// ============================================================

export type Appointment = {
  id: string;
  babyId: string;
  familyId: string;
  title: string;
  doctorName: string | null;
  specialty: string | null;
  /** ISO 8601 com timezone (ex: '2026-06-10T14:30:00.000Z'). */
  scheduledAt: string;
  location: string | null;
  notes: string | null;
  status: AppointmentStatus;
  reminderEnabled: boolean;
  reminderMinutesBefore: number;
  /** ISO date-time. Preenchido quando status = COMPLETED. */
  completedAt: string | null;
  /** Anotacoes pos-consulta (peso, altura, prescricoes, etc). */
  completedNotes: string | null;
  /** ISO date-time. Preenchido quando status = CANCELED. */
  canceledAt: string | null;
  /** Motivo do cancelamento. */
  cancelReason: string | null;
  /** ISO date-time. */
  createdAt: string;
  /** ISO date-time. */
  updatedAt: string;
};

// ============================================================
// Bodies (request)
// ============================================================

export type CreateAppointmentBody = {
  title: string;
  doctorName?: string;
  specialty?: string;
  /** ISO 8601 com timezone. */
  scheduledAt: string;
  location?: string;
  notes?: string;
  reminderEnabled?: boolean;
  reminderMinutesBefore?: ReminderMinutes;
};

export type UpdateAppointmentBody = Partial<CreateAppointmentBody>;

export type CompleteAppointmentBody = {
  /** Anotacoes pos-consulta: peso, altura, prescricoes, proxima visita... */
  notes?: string;
};

export type CancelAppointmentBody = {
  /** Motivo do cancelamento (max 200 chars). */
  reason?: string;
};

export type AppointmentFilter = {
  status?: AppointmentStatus;
  scope?: AppointmentScope;
  /** ISO date-time. */
  from?: string;
  /** ISO date-time. */
  to?: string;
};
