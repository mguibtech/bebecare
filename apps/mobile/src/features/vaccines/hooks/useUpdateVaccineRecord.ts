/**
 * Atualizar dados de um registro (data, lote, local, notas).
 *
 * onSuccess inválida schedule + records — dados derivados podem mudar
 * (ex: se mudar a data, o status pode reclassificar).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { vaccineRecordsApi } from '../api/vaccine-records.api';
import type { UpdateVaccineRecordBody, VaccineRecord } from '../types';

type UpdateVaccineRecordArgs = {
  babyId: string;
  id: string;
  body: UpdateVaccineRecordBody;
};

export function useUpdateVaccineRecord() {
  const queryClient = useQueryClient();

  return useMutation<VaccineRecord, Error, UpdateVaccineRecordArgs>({
    mutationFn: ({ babyId, id, body }) =>
      vaccineRecordsApi.update(babyId, id, body),
    onSuccess: (_data, { babyId }) => {
      queryClient.invalidateQueries({ queryKey: qk.vaccines.schedule(babyId) });
      queryClient.invalidateQueries({ queryKey: qk.vaccines.records(babyId) });
    },
  });
}
