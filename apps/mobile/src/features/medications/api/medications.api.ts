/**
 * Camada HTTP de medicamentos + schedules nested.
 *
 *   GET    /babies/:babyId/medications
 *   POST   /babies/:babyId/medications
 *   GET    /babies/:babyId/medications/:id
 *   PATCH  /babies/:babyId/medications/:id
 *   DELETE /babies/:babyId/medications/:id
 *
 *   POST   /babies/:babyId/medications/:medicationId/schedules
 *   PATCH  /babies/:babyId/medications/:medicationId/schedules/:id
 *   DELETE /babies/:babyId/medications/:medicationId/schedules/:id
 *
 * Dose logs (take/skip/reset) tem arquivo proprio: dose-logs.api.ts
 */

import { apiClient } from '@/shared/api/client';

import type {
  CreateMedScheduleBody,
  CreateMedicationBody,
  MedSchedule,
  Medication,
  UpdateMedScheduleBody,
  UpdateMedicationBody,
} from '../types';

export const medicationsApi = {
  // ----- Medications CRUD -----

  async list(babyId: string): Promise<Medication[]> {
    const { data } = await apiClient.get<Medication[]>(
      `/babies/${babyId}/medications`,
    );
    return data;
  },

  async getOne(babyId: string, id: string): Promise<Medication> {
    const { data } = await apiClient.get<Medication>(
      `/babies/${babyId}/medications/${id}`,
    );
    return data;
  },

  async create(
    babyId: string,
    body: CreateMedicationBody,
  ): Promise<Medication> {
    const { data } = await apiClient.post<Medication>(
      `/babies/${babyId}/medications`,
      body,
    );
    return data;
  },

  async update(
    babyId: string,
    id: string,
    body: UpdateMedicationBody,
  ): Promise<Medication> {
    const { data } = await apiClient.patch<Medication>(
      `/babies/${babyId}/medications/${id}`,
      body,
    );
    return data;
  },

  async remove(babyId: string, id: string): Promise<void> {
    await apiClient.delete(`/babies/${babyId}/medications/${id}`);
  },

  // ----- Schedules nested -----

  async createSchedule(
    babyId: string,
    medicationId: string,
    body: CreateMedScheduleBody,
  ): Promise<MedSchedule> {
    const { data } = await apiClient.post<MedSchedule>(
      `/babies/${babyId}/medications/${medicationId}/schedules`,
      body,
    );
    return data;
  },

  async updateSchedule(
    babyId: string,
    medicationId: string,
    id: string,
    body: UpdateMedScheduleBody,
  ): Promise<MedSchedule> {
    const { data } = await apiClient.patch<MedSchedule>(
      `/babies/${babyId}/medications/${medicationId}/schedules/${id}`,
      body,
    );
    return data;
  },

  async removeSchedule(
    babyId: string,
    medicationId: string,
    id: string,
  ): Promise<void> {
    await apiClient.delete(
      `/babies/${babyId}/medications/${medicationId}/schedules/${id}`,
    );
  },
};
