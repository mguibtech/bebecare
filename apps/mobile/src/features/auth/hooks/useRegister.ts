/**
 * Hook de registro.
 *
 * Mesmo fluxo do useLogin: ao sucesso, persiste tokens e o RootNavigator
 * faz o switch pra AppStack.
 *
 * Body opcional inviteCode entra na familia existente em vez de criar
 * uma familia nova solo.
 */

import { useMutation } from '@tanstack/react-query';

import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import type { AuthResponse, RegisterBody } from '../types';

export function useRegister() {
  return useMutation<AuthResponse, Error, RegisterBody>({
    mutationFn: (body) => authApi.register(body),
    onSuccess: async (data) => {
      await useAuthStore.getState().signIn({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}
