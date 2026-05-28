/**
 * Registrar uma dose aplicada.
 *
 * onSuccess invalida:
 *  - schedule do bebe (status da dose passa pra APPLIED)
 *  - records do bebe (lista cresce em 1)
 *
 * Optimistic update do schedule seria ideal mas o backend calcula campos
 * derivados (status, appliedAt) — refetch eh mais seguro que reproduzir
 * a logica no front.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

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
      snackbar.showSuccess(`${data.vaccine.name} marcada como aplicada`);
    },
  });
}
