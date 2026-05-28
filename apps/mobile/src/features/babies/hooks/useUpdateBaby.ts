/**
 * Atualizar bebe (PATCH parcial).
 *
 * onSuccess atualiza ambos caches: detalhe (setQueryData) e lista
 * (invalidate, mais conservador — o backend pode mudar ageMonths/ageDays
 * recalculados, melhor pegar fresh).
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { babiesApi } from '../api/babies.api';
import type { Baby, UpdateBabyBody } from '../types';

type UpdateBabyArgs = {
  id: string;
  body: UpdateBabyBody;
};

export function useUpdateBaby() {
  const queryClient = useQueryClient();

  return useMutation<Baby, Error, UpdateBabyArgs>({
    mutationFn: ({ id, body }) => babiesApi.update(id, body),
    onSuccess: (baby) => {
      queryClient.setQueryData(qk.babies.detail(baby.id), baby);
      queryClient.invalidateQueries({ queryKey: qk.babies.list() });
      snackbar.showSuccess('Alterações salvas');
    },
  });
}
