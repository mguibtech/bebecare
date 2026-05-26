import { create } from 'zustand';

import { secureStorage, type AuthTokens } from '@/shared/storage/secureStorage';

/**
 * Store de autenticacao (estado de cliente: token em memoria + flag boot).
 * Dados do usuario logado (perfil) ficam no React Query (cache do server),
 * NAO aqui. Esta store cuida APENAS do que e local: tokens e status.
 */

type AuthStatus = 'booting' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;

  // Acoes
  hydrate: () => Promise<void>;
  signIn: (tokens: AuthTokens) => Promise<void>;
  signOut: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  status: 'booting',
  accessToken: null,
  refreshToken: null,

  async hydrate() {
    const tokens = await secureStorage.loadTokens();
    if (tokens) {
      set({
        status: 'authenticated',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });
    } else {
      set({ status: 'unauthenticated' });
    }
  },

  async signIn(tokens) {
    await secureStorage.saveTokens(tokens);
    set({
      status: 'authenticated',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  },

  async signOut() {
    await secureStorage.clearTokens();
    set({
      status: 'unauthenticated',
      accessToken: null,
      refreshToken: null,
    });
  },
}));

/**
 * Acesso sincrono ao token sem subscription (uso interno do axios interceptor).
 * Componentes/hooks devem usar useAuthStore() normalmente.
 */
export const getAccessTokenSync = (): string | null =>
  useAuthStore.getState().accessToken;
