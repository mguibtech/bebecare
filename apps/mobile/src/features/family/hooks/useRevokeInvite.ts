/**
 * Revoga convite pendente. Outros membros não podem mais usa-lo.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';
import i18n from '@/shared/i18n';

import { familyApi } from '../api/family.api';

export function useRevokeInvite() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) => familyApi.revokeInvite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.family.me() });
      snackbar.show(i18n.t('feedback.inviteRevoked'));
    },
  });
}
