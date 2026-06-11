/**
 * Mutations dos schedules nested de um medicamento.
 *
 * Schedules são mexidos diretamente no MedicationFormScreen ou em
 * MedicationDetailScreen — inválida o detalhe do medicamento pra refletir
 * (schedules vem embarcados no Medication response).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';
import i18n from '@/shared/i18n';

import { medicationsApi } from '../api/medications.api';
import type {
  CreateMedScheduleBody,
  MedSchedule,
  UpdateMedScheduleBody,
} from '../types';

// ---------- CREATE ----------

type CreateScheduleArgs = {
  babyId: string;
  medicationId: string;
  body: CreateMedScheduleBody;
};

export function useCreateMedSchedule() {
  const queryClient = useQueryClient();
  return useMutation<MedSchedule, Error, CreateScheduleArgs>({
    mutationFn: ({ babyId, medicationId, body }) =>
      medicationsApi.createSchedule(babyId, medicationId, body),
    onSuccess: (_data, { babyId, medicationId }) => {
      queryClient.invalidateQueries({
        queryKey: qk.medications.detail(babyId, medicationId),
      });
      queryClient.invalidateQueries({ queryKey: qk.medications.list(babyId) });
      queryClient.invalidateQueries({ queryKey: qk.doseLogs.all });
      snackbar.showSuccess(i18n.t('feedback.scheduleAdded'));
    },
  });
}

// ---------- UPDATE ----------

type UpdateScheduleArgs = {
  babyId: string;
  medicationId: string;
  id: string;
  body: UpdateMedScheduleBody;
};

export function useUpdateMedSchedule() {
  const queryClient = useQueryClient();
  return useMutation<MedSchedule, Error, UpdateScheduleArgs>({
    mutationFn: ({ babyId, medicationId, id, body }) =>
      medicationsApi.updateSchedule(babyId, medicationId, id, body),
    onSuccess: (_data, { babyId, medicationId }) => {
      queryClient.invalidateQueries({
        queryKey: qk.medications.detail(babyId, medicationId),
      });
      queryClient.invalidateQueries({ queryKey: qk.medications.list(babyId) });
      queryClient.invalidateQueries({ queryKey: qk.doseLogs.all });
      snackbar.showSuccess(i18n.t('feedback.scheduleUpdated'));
    },
  });
}

// ---------- DELETE ----------

type DeleteScheduleArgs = {
  babyId: string;
  medicationId: string;
  id: string;
};

export function useDeleteMedSchedule() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, DeleteScheduleArgs>({
    mutationFn: ({ babyId, medicationId, id }) =>
      medicationsApi.removeSchedule(babyId, medicationId, id),
    onSuccess: (_data, { babyId, medicationId }) => {
      queryClient.invalidateQueries({
        queryKey: qk.medications.detail(babyId, medicationId),
      });
      queryClient.invalidateQueries({ queryKey: qk.medications.list(babyId) });
      queryClient.invalidateQueries({ queryKey: qk.doseLogs.all });
      snackbar.show('Horário removido');
    },
  });
}
