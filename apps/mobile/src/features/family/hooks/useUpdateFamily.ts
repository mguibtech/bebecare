/**
 * Renomear familia (ou limpar nome com null).
 *
 * onSuccess atualiza o cache da familia diretamente — backend devolve
 * o objeto inteiro depois do patch.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { familyApi } from '../api/family.api';
import type { FamilyDetails, UpdateFamilyBody } from '../types';

export function useUpdateFamily() {
  const queryClient = useQueryClient();

  return useMutation<FamilyDetails, Error, UpdateFamilyBody>({
    mutationFn: (body) => familyApi.update(body),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.family.me(), data);
      // O /auth/me tambem traz a familia abreviada (FamilySummary),
      // entao invalidamos pra ele atualizar tambem.
      queryClient.invalidateQueries({ queryKey: qk.auth.me() });
    },
  });
}
