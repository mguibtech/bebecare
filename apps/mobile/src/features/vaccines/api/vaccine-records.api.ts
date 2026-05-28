/**
 * Camada HTTP de VaccineRecords (aplicacoes registradas).
 *
 *   GET    /babies/:babyId/vaccine-records      historico do bebe
 *   POST   /babies/:babyId/vaccine-records      registrar dose
 *   PATCH  /babies/:babyId/vaccine-records/:id  corrigir registro
 *   DELETE /babies/:babyId/vaccine-records/:id  apagar (engano)
 */

import { apiClient } from '@/shared/api/client';

import type {
  CreateVaccineRecordBody,
  UpdateVaccineRecordBody,
  VaccineRecord,
} from '../types';

export const vaccineRecordsApi = {
  async list(babyId: string): Promise<VaccineRecord[]> {
    const { data } = await apiClient.get<VaccineRecord[]>(
      `/babies/${babyId}/vaccine-records`,
    );
    return data;
  },

  async create(
    babyId: string,
    body: CreateVaccineRecordBody,
  ): Promise<VaccineRecord> {
    const { data } = await apiClient.post<VaccineRecord>(
      `/babies/${babyId}/vaccine-records`,
      body,
    );
    return data;
  },

  async update(
    babyId: string,
    id: string,
    body: UpdateVaccineRecordBody,
  ): Promise<VaccineRecord> {
    const { data } = await apiClient.patch<VaccineRecord>(
      `/babies/${babyId}/vaccine-records/${id}`,
      body,
    );
    return data;
  },

  async remove(babyId: string, id: string): Promise<void> {
    await apiClient.delete(`/babies/${babyId}/vaccine-records/${id}`);
  },
};
