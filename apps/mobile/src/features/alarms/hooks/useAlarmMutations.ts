/**
 * Mutations dos despertadores (create / update / delete).
 *
 * Toda mutation inválida a lista — o sync de alarmes locais (useAlarmSync)
 * observa a lista e reagenda o notifee automaticamente.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { alarmsApi } from '../api/alarms.api';
import type { Alarm, CreateAlarmBody, UpdateAlarmBody } from '../types';

export function useCreateAlarm() {
  const queryClient = useQueryClient();
  return useMutation<Alarm, Error, CreateAlarmBody>({
    mutationFn: (body) => alarmsApi.create(body),
    onSuccess: (alarm) => {
      queryClient.invalidateQueries({ queryKey: qk.alarms.all });
      snackbar.showSuccess(`Despertador "${alarm.label}" criado`);
    },
  });
}

type UpdateArgs = { id: string; body: UpdateAlarmBody };

export function useUpdateAlarm() {
  const queryClient = useQueryClient();
  return useMutation<Alarm, Error, UpdateArgs>({
    mutationFn: ({ id, body }) => alarmsApi.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.alarms.all });
      snackbar.showSuccess('Despertador atualizado');
    },
  });
}

export function useDeleteAlarm() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id) => alarmsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.alarms.all });
      snackbar.show('Despertador removido');
    },
  });
}
