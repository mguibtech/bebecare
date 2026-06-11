/**
 * Renomear família (ou limpar nome com null).
 *
 * onSuccess atualiza o cache da família diretamente — backend devolve
 * o objeto inteiro depois do patch.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';
import i18n from '@/shared/i18n';

import { familyApi } from '../api/family.api';
import type { FamilyDetails, UpdateFamilyBody } from '../types';

export function useUpdateFamily() {
  const queryClient = useQueryClient();

  return useMutation<FamilyDetails, Error, UpdateFamilyBody>({
    mutationFn: (body) => familyApi.update(body),
    onSuccess: (data) => {
      queryClient.setQueryData(qk.family.me(), data);
      // O /auth/me também traz a família abreviada (FamilySummary),
      // entao invalidamos pra ele atualizar também.
      queryClient.invalidateQueries({ queryKey: qk.auth.me() });
      snackbar.showSuccess(i18n.t('feedback.familyUpdated'));
    },
  });
}
