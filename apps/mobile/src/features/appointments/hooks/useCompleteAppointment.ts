/**
 * Marcar consulta como realizada (POST /complete).
 * Body opcional: notas pos-consulta (peso, altura, prescricoes, etc).
 *
 * Status muda pra COMPLETED no backend; mobile invalida pra refletir.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { appointmentsApi } from '../api/appointments.api';
import type {
  Appointment,
  CompleteAppointmentBody,
} from '../types';

type CompleteArgs = {
  babyId: string;
  id: string;
  body: CompleteAppointmentBody;
};

export function useCompleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, Error, CompleteArgs>({
    mutationFn: ({ babyId, id, body }) =>
      appointmentsApi.complete(babyId, id, body),
    onSuccess: (data, { babyId }) => {
      queryClient.setQueryData(
        qk.appointments.detail(babyId, data.id),
        data,
      );
      queryClient.invalidateQueries({ queryKey: qk.appointments.all });
      snackbar.showSuccess('Consulta marcada como realizada');
    },
  });
}
