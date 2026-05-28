/**
 * Revoga convite pendente. Outros membros nao podem mais usa-lo.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { familyApi } from '../api/family.api';

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => familyApi.revokeInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.family.me() });
      snackbar.show('Convite revogado');
    },
  });
}
