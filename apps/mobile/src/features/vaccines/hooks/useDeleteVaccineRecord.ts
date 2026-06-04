/**
 * Apagar um registro (caso de engano de digitacao).
 *
 * Backend faz DELETE definitivo (não soft-delete) — engano no histo de
 * vacina deve sumir mesmo, não "ficar pendurado".
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { vaccineRecordsApi } from '../api/vaccine-records.api';

type DeleteVaccineRecordArgs = {
  babyId: string;
  id: string;
};

export function useDeleteVaccineRecord() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteVaccineRecordArgs>({
    mutationFn: ({ babyId, id }) => vaccineRecordsApi.remove(babyId, id),
    onSuccess: (_data, { babyId }) => {
      queryClient.invalidateQueries({ queryKey: qk.vaccines.schedule(babyId) });
      queryClient.invalidateQueries({ queryKey: qk.vaccines.records(babyId) });
      snackbar.show('Registro apagado');
    },
  });
}
