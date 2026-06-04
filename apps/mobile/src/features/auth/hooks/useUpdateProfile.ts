/**
 * Edita nome e/ou avatar do usuário logado (PATCH /users/me).
 * Inválida /auth/me pra a UI (MoreScreen, headers) refletir.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { authApi } from '../api/auth.api';
import type { UpdateProfileBody, UserPublic } from '../types';

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation<UserPublic, Error, UpdateProfileBody>({
    mutationFn: (body) => authApi.updateProfile(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.auth.me() });
      snackbar.showSuccess('Perfil atualizado');
    },
  });
}
