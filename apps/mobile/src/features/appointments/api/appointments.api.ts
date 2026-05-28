/**
 * Camada HTTP do dominio appointments.
 *
 *   GET    /babies/:babyId/appointments        lista com filtros
 *   POST   /babies/:babyId/appointments        cria
 *   GET    /babies/:babyId/appointments/:id    detalhe
 *   PATCH  /babies/:babyId/appointments/:id    edita (parcial)
 *   DELETE /babies/:babyId/appointments/:id    apaga (defintivo)
 *   POST   /babies/:babyId/appointments/:id/complete  registra como realizada
 *   POST   /babies/:babyId/appointments/:id/cancel    cancela com motivo
 */

import { apiClient } from '@/shared/api/client';

import type {
  Appointment,
  AppointmentFilter,
  CancelAppointmentBody,
  CompleteAppointmentBody,
  CreateAppointmentBody,
  UpdateAppointmentBody,
} from '../types';

/** Converte filter object em query string limpa (omite undefined). */
function toQuery(filter?: AppointmentFilter): string {
  if (!filter) return '';
  const entries = Object.entries(filter).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  const params = new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)]),
  );
  return '?' + params.toString();
}

export const appointmentsApi = {
  /** GET /babies/:babyId/appointments?scope=upcoming */
  async list(
    babyId: string,
    filter?: AppointmentFilter,
  ): Promise<Appointment[]> {
    const { data } = await apiClient.get<Appointment[]>(
      `/babies/${babyId}/appointments${toQuery(filter)}`,
    );
    return data;
  },

  async getOne(babyId: string, id: string): Promise<Appointment> {
    const { data } = await apiClient.get<Appointment>(
      `/babies/${babyId}/appointments/${id}`,
    );
    return data;
  },

  async create(
    babyId: string,
    body: CreateAppointmentBody,
  ): Promise<Appointment> {
    const { data } = await apiClient.post<Appointment>(
      `/babies/${babyId}/appointments`,
      body,
    );
    return data;
  },

  async update(
    babyId: string,
    id: string,
    body: UpdateAppointmentBody,
  ): Promise<Appointment> {
    const { data } = await apiClient.patch<Appointment>(
      `/babies/${babyId}/appointments/${id}`,
      body,
    );
    return data;
  },

  async remove(babyId: string, id: string): Promise<void> {
    await apiClient.delete(`/babies/${babyId}/appointments/${id}`);
  },

  /** POST /complete — marca como realizada com notas opcionais. */
  async complete(
    babyId: string,
    id: string,
    body: CompleteAppointmentBody,
  ): Promise<Appointment> {
    const { data } = await apiClient.post<Appointment>(
      `/babies/${babyId}/appointments/${id}/complete`,
      body,
    );
    return data;
  },

  /** POST /cancel — cancela com motivo opcional. */
  async cancel(
    babyId: string,
    id: string,
    body: CancelAppointmentBody,
  ): Promise<Appointment> {
    const { data } = await apiClient.post<Appointment>(
      `/babies/${babyId}/appointments/${id}/cancel`,
      body,
    );
    return data;
  },
};
