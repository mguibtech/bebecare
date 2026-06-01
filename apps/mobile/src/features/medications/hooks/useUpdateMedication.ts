import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { medicationsApi } from '../api/medications.api';
import type { Medication, UpdateMedicationBody } from '../types';

type UpdateArgs = {
  babyId: string;
  id: string;
  body: UpdateMedicationBody;
};

export function useUpdateMedication() {
  const queryClient = useQueryClient();

  return useMutation<Medication, Error, UpdateArgs>({
    mutationFn: ({ babyId, id, body }) =>
      medicationsApi.update(babyId, id, body),
    onSuccess: (med, { babyId }) => {
      queryClient.setQueryData(
        qk.medications.detail(babyId, med.id),
        med,
      );
      queryClient.invalidateQueries({ queryKey: qk.medications.all });
      queryClient.invalidateQueries({ queryKey: qk.doseLogs.all });
      snackbar.showSuccess('Medicamento atualizado');
    },
  });
}
