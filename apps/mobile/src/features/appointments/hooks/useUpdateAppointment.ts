/**
 * Editar consulta (campos parciais).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { appointmentsApi } from '../api/appointments.api';
import type { Appointment, UpdateAppointmentBody } from '../types';

type UpdateArgs = {
  babyId: string;
  id: string;
  body: UpdateAppointmentBody;
};

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, Error, UpdateArgs>({
    mutationFn: ({ babyId, id, body }) =>
      appointmentsApi.update(babyId, id, body),
    onSuccess: (data, { babyId }) => {
      queryClient.setQueryData(
        qk.appointments.detail(babyId, data.id),
        data,
      );
      queryClient.invalidateQueries({ queryKey: qk.appointments.all });
      snackbar.showSuccess('Consulta atualizada');
    },
  });
}
