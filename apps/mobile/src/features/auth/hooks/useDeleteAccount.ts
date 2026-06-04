/**
 * Excluir a propria conta (LGPD soft-delete).
 *
 * Fluxo:
 *  1. DELETE /users/me — backend marca conta como excluida
 *  2. signOut (limpa Keychain + state)
 *  3. queryClient.clear (zera todo cache do RQ)
 *  4. RootNavigator detecta status='unauthenticated' e volta pro Login
 *
 * Cuidado: não tem volta na UX — quem chama esse hook precisa pedir
 * confirmacao DUPLA (dialog + checkbox/segunda confirmacao) porque eh
 * destrutivo. Soft-delete eh recuperavel em 30 dias mas exige contato
 * com o suporte.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';

export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => authApi.deleteAccount(),
    onSuccess: async () => {
      // Limpa tudo local — backend já invalidou a conta.
      await useAuthStore.getState().signOut();
      queryClient.clear();
    },
  });
}
