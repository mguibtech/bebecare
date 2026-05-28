/**
 * Cria novo convite (codigo de 6 digitos, valido 7 dias).
 *
 * onSuccess invalida a familia inteira (pra trazer o pendingInvites
 * atualizado). UI espera o convite no retorno pra ja abrir a Share API.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { familyApi } from '../api/family.api';
import type { Invite } from '../types';

export function useCreateInvite() {
  const queryClient = useQueryClient();

  return useMutation<Invite, Error, void>({
    mutationFn: () => familyApi.createInvite(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.family.me() });
    },
  });
}
