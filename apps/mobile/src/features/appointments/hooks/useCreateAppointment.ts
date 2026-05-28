/**
 * Criar consulta. onSuccess invalida listas do bebe e mostra snackbar.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { appointmentsApi } from '../api/appointments.api';
import type { Appointment, CreateAppointmentBody } from '../types';

type CreateArgs = {
  babyId: string;
  body: CreateAppointmentBody;
};

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation<Appointment, Error, CreateArgs>({
    mutationFn: ({ babyId, body }) =>
      appointmentsApi.create(babyId, body),
    onSuccess: (_data, { babyId }) => {
      queryClient.invalidateQueries({ queryKey: qk.appointments.all });
      queryClient.setQueryData(
        qk.appointments.detail(babyId, _data.id),
        _data,
      );
      snackbar.showSuccess('Consulta agendada');
    },
  });
}
