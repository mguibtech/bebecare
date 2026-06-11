/**
 * Apagar consulta definitivamente (engano de digitacao).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';
import i18n from '@/shared/i18n';

import { appointmentsApi } from '../api/appointments.api';

type DeleteArgs = {
  babyId: string;
  id: string;
};

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, DeleteArgs>({
    mutationFn: ({ babyId, id }) => appointmentsApi.remove(babyId, id),
    onSuccess: (_data, { babyId, id }) => {
      queryClient.removeQueries({
        queryKey: qk.appointments.detail(babyId, id),
      });
      queryClient.invalidateQueries({ queryKey: qk.appointments.all });
      snackbar.show(i18n.t('feedback.appointmentDeleted'));
    },
  });
}
