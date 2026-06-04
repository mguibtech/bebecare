/**
 * Camada HTTP dos dose logs (doses esperadas + atualizacoes de status).
 *
 *   GET   /babies/:babyId/doses           filtra por status/from/to
 *   GET   /babies/:babyId/doses/today     atalho doses do dia
 *   POST  /babies/:babyId/doses/:id/take  marca como tomada (sem body)
 *   POST  /babies/:babyId/doses/:id/skip  pula com motivo opcional
 *   POST  /babies/:babyId/doses/:id/reset volta pra PENDING
 *
 * Dose logs são criados pelo cron do backend baseado nos schedules ativos.
 * Mobile NAO cria diretamente.
 */

import { apiClient } from '@/shared/api/client';

import type { DoseLogFilter, MedDoseLog, SkipDoseBody } from '../types';

function toQuery(filter?: DoseLogFilter): string {
  if (!filter) return '';
  const entries = Object.entries(filter).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (entries.length === 0) return '';
  return (
    '?' +
    new URLSearchParams(
      entries.map(([k, v]) => [k, String(v)]),
    ).toString()
  );
}

export const doseLogsApi = {
  /** GET /babies/:babyId/doses com filtros. */
  async list(
    babyId: string,
    filter?: DoseLogFilter,
  ): Promise<MedDoseLog[]> {
    const { data } = await apiClient.get<MedDoseLog[]>(
      `/babies/${babyId}/doses${toQuery(filter)}`,
    );
    return data;
  },

  /** GET /babies/:babyId/doses/today — doses do dia. */
  async listToday(babyId: string): Promise<MedDoseLog[]> {
    const { data } = await apiClient.get<MedDoseLog[]>(
      `/babies/${babyId}/doses/today`,
    );
    return data;
  },

  /** POST .../:id/take — marca dose como tomada. */
  async take(babyId: string, id: string): Promise<MedDoseLog> {
    const { data } = await apiClient.post<MedDoseLog>(
      `/babies/${babyId}/doses/${id}/take`,
    );
    return data;
  },

  /** POST .../:id/skip — pula com motivo opcional. */
  async skip(
    babyId: string,
    id: string,
    body: SkipDoseBody,
  ): Promise<MedDoseLog> {
    const { data } = await apiClient.post<MedDoseLog>(
      `/babies/${babyId}/doses/${id}/skip`,
      body,
    );
    return data;
  },

  /** POST .../:id/reset — volta pra PENDING. */
  async reset(babyId: string, id: string): Promise<MedDoseLog> {
    const { data } = await apiClient.post<MedDoseLog>(
      `/babies/${babyId}/doses/${id}/reset`,
    );
    return data;
  },
};
