/**
 * Cria novo convite (código de 6 digitos, valido 7 dias).
 *
 * onSuccess inválida a família inteira (pra trazer o pendingInvites
 * atualizado). UI espera o convite no retorno pra já abrir a Share API.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';
import i18n from '@/shared/i18n';

import { familyApi } from '../api/family.api';
import type { Invite } from '../types';

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation<Invite, Error, void>({
    mutationFn: () => familyApi.createInvite(),
    onSuccess: (invite) => {
      queryClient.invalidateQueries({ queryKey: qk.family.me() });
      snackbar.showSuccess(i18n.t('feedback.inviteCreated', { code: invite.code }));
    },
  });
}
