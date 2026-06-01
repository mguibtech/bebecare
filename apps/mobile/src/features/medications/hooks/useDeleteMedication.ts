import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { medicationsApi } from '../api/medications.api';

type DeleteArgs = {
  babyId: string;
  id: string;
};

export function useDeleteMedication() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteArgs>({
    mutationFn: ({ babyId, id }) => medicationsApi.remove(babyId, id),
    onSuccess: (_data, { babyId, id }) => {
      queryClient.removeQueries({
        queryKey: qk.medications.detail(babyId, id),
      });
      queryClient.invalidateQueries({ queryKey: qk.medications.all });
      queryClient.invalidateQueries({ queryKey: qk.doseLogs.all });
      snackbar.show('Medicamento removido');
    },
  });
}
