/**
 * Cancelar consulta (POST /cancel) com motivo opcional.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { appointmentsApi } from '../api/appointments.api';
import type { Appointment, CancelAppointmentBody } from '../types';

type CancelArgs = {
  babyId: string;
  id: string;
  body: CancelAppointmentBody;
};

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, Error, CancelArgs>({
    mutationFn: ({ babyId, id, body }) =>
      appointmentsApi.cancel(babyId, id, body),
    onSuccess: (data, { babyId }) => {
      queryClient.setQueryData(
        qk.appointments.detail(babyId, data.id),
        data,
      );
      queryClient.invalidateQueries({ queryKey: qk.appointments.all });
      snackbar.show('Consulta cancelada');
    },
  });
}
