/**
 * Camada HTTP do catalogo + schedule de vacinas.
 *
 *   GET /vaccines/catalog                      catalogo PNI (cacheavel)
 *   GET /babies/:babyId/vaccine-schedule       schedule do bebe c/ status calculado
 *
 * Records (CRUD) tem arquivo proprio: vaccine-records.api.ts
 */

import { apiClient } from '@/shared/api/client';

import type { BabyVaccineSchedule, Vaccine } from '../types';

export const vaccinesApi = {
  /** GET /vaccines/catalog — catalogo PNI completo. */
  async getCatalog(): Promise<Vaccine[]> {
    const { data } = await apiClient.get<Vaccine[]>('/vaccines/catalog');
    return data;
  },

  /** GET /babies/:babyId/vaccine-schedule — schedule c/ status calculado pelo backend. */
  async getScheduleForBaby(babyId: string): Promise<BabyVaccineSchedule> {
    const { data } = await apiClient.get<BabyVaccineSchedule>(
      `/babies/${babyId}/vaccine-schedule`,
    );
    return data;
  },
};
