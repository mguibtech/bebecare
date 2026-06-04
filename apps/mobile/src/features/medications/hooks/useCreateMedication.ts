import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { medicationsApi } from '../api/medications.api';
import type { CreateMedicationBody, Medication } from '../types';

type CreateArgs = {
  babyId: string;
  body: CreateMedicationBody;
};

export function useCreateMedication() {
  const queryClient = useQueryClient();

  return useMutation<Medication, Error, CreateArgs>({
    mutationFn: ({ babyId, body }) =>
      medicationsApi.create(babyId, body),
    onSuccess: (med, { babyId }) => {
      queryClient.setQueryData(
        qk.medications.detail(babyId, med.id),
        med,
      );
      queryClient.invalidateQueries({ queryKey: qk.medications.all });
      // Dose logs são criados pelo cron — inválida pra refletir quando
      // o usuário voltar pra tela "Hoje".
      queryClient.invalidateQueries({ queryKey: qk.doseLogs.all });
      snackbar.showSuccess(`${med.name} cadastrado`);
    },
  });
}
