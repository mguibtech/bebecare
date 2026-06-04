/**
 * Camada HTTP dos despertadores (por usuário).
 *
 *   GET    /alarms
 *   POST   /alarms
 *   GET    /alarms/:id
 *   PATCH  /alarms/:id
 *   DELETE /alarms/:id
 */

import { apiClient } from '@/shared/api/client';

import type { Alarm, CreateAlarmBody, UpdateAlarmBody } from '../types';

export const alarmsApi = {
  async list(): Promise<Alarm[]> {
    const { data } = await apiClient.get<Alarm[]>('/alarms');
    return data;
  },

  async getOne(id: string): Promise<Alarm> {
    const { data } = await apiClient.get<Alarm>(`/alarms/${id}`);
    return data;
  },

  async create(body: CreateAlarmBody): Promise<Alarm> {
    const { data } = await apiClient.post<Alarm>('/alarms', body);
    return data;
  },

  async update(id: string, body: UpdateAlarmBody): Promise<Alarm> {
    const { data } = await apiClient.patch<Alarm>(`/alarms/${id}`, body);
    return data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/alarms/${id}`);
  },
};
