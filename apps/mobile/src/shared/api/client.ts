import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

import { env } from '@/shared/config/env';
import { useAuthStore } from '@/features/auth/store/auth.store';

import { ApiError, type ApiErrorPayload } from './types';

/**
 * Cliente HTTP unico do app.
 *
 * Responsabilidades:
 * - Injetar JWT do auth.store em todo request
 * - Normalizar erros em ApiError (componentes nao lidam com AxiosError raw)
 * - Em 401: deslogar o usuario (limpar tokens + state)
 *
 * NAO faz refresh automatico ainda — sera adicionado quando o backend
 * expuser /auth/refresh. Por enquanto 401 => logout.
 */
export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request: injeta JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response: normaliza erros
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;

    // 401: token invalido/expirado => derruba sessao
    if (status === 401) {
      await useAuthStore.getState().signOut();
    }

    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message ?? error.message ?? 'Erro de conexao';

    return Promise.reject(new ApiError(message, status, payload));
  },
);
