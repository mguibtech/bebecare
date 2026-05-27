/**
 * Hook de login.
 *
 * Responsabilidades:
 * 1. Bater em POST /auth/login.
 * 2. Persistir tokens via authStore.signIn (que salva no Keychain).
 * 3. NAO popula o cache do useMe — quem precisar do perfil chama useMe()
 *    depois do login. Isso evita acoplar com o shape do /auth/me e duplicar
 *    fontes de verdade.
 *
 * O RootNavigator escuta `useAuthStore(s => s.status)` e troca pra AppStack
 * sozinho quando status vira 'authenticated'.
 */

import { useMutation } from '@tanstack/react-query';

import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import type { AuthResponse, LoginBody } from '../types';

export function useLogin() {
  return useMutation<AuthResponse, Error, LoginBody>({
    mutationFn: (body) => authApi.login(body),
    onSuccess: async (data) => {
      await useAuthStore.getState().signIn({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      });
    },
  });
}
