/**
 * Registrar uma dose aplicada.
 *
 * onSuccess inválida:
 *  - schedule do bebê (status da dose passa pra APPLIED)
 *  - records do bebê (lista cresce em 1)
 *
 * Optimistic update do schedule seria ideal mas o backend calcula campos
 * derivados (status, appliedAt) — refetch eh mais seguro que reproduzir
 * a logica no front.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';
import i18n from '@/shared/i18n';

import { vaccineRecordsApi } from '../api/vaccine-records.api';
import type { CreateVaccineRecordBody, VaccineRecord } from '../types';

type CreateVaccineRecordArgs = {
  babyId: string;
  body: CreateVaccineRecordBody;
};

export function useCreateVaccineRecord() {
  const queryClient = useQueryClient();

  return useMutation<VaccineRecord, Error, CreateVaccineRecordArgs>({
    mutationFn: ({ babyId, body }) =>
      vaccineRecordsApi.create(babyId, body),
    onSuccess: (data, { babyId }) => {
      queryClient.invalidateQueries({ queryKey: qk.vaccines.schedule(babyId) });
      queryClient.invalidateQueries({ queryKey: qk.vaccines.records(babyId) });
      snackbar.showSuccess(i18n.t('feedback.vaccineApplied', { name: data.vaccine.name }));
    },
  });
}
