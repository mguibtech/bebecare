import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

import { env } from '@/shared/config/env';
import { useAuthStore } from '@/features/auth/store/auth.store';

import { ApiError, type ApiErrorPayload } from './types';

/**
 * Cliente HTTP unico do app.
 *
 * Responsabilidades:
 * - Injetar JWT do auth.store em todo request.
 * - Normalizar erros em ApiError (componentes não lidam com AxiosError raw).
 * - Em 401: tentar refresh transparente (Promise singleton pra evitar refresh
 *   paralelo) e retentar a request original com o novo token. Se refresh
 *   falhar, desloga o usuário.
 *
 * Endpoints de auth (/auth/login, /auth/register, /auth/refresh, /auth/logout)
 * NAO disparam refresh em 401 — neles, 401 significa credenciais ruins / token
 * inválido e deve ser propagado direto pro chamador.
 */
export const apiClient = axios.create({
  baseURL: env.API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------- Request: injeta JWT ----------
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

// ---------- Refresh strategy (Promise singleton) ----------

/**
 * URLs que NAO devem disparar refresh em 401 — são endpoints públicos ou
 * de auth onde 401 tem outro significado (credenciais erradas, refresh token
 * inválido). Comparação por sufixo do path (case-sensitive).
 */
const AUTH_BYPASS_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
];

/**
 * Promise em curso de refresh, se houver. Garante que multiplas requests que
 * deram 401 ao mesmo tempo aguardem a MESMA chamada a /auth/refresh.
 * Resolve com o novo accessToken; rejeita se refresh falhar.
 */
let refreshPromise: Promise<string> | null = null;

/**
 * Executa /auth/refresh e atualiza tokens no store.
 *
 * Importante: usa axios "cru" (não o apiClient) pra evitar loop infinito do
 * proprio interceptor de refresh.
 */
async function performRefresh(): Promise<string> {
  const currentRefreshToken = useAuthStore.getState().refreshToken;
  if (!currentRefreshToken) {
    throw new Error('Sem refresh token disponível');
  }

  // Chamada direta — sem interceptor do apiClient.
  const { data } = await axios.post<{
    accessToken: string;
    refreshToken: string;
  }>(
    `${env.API_BASE_URL}/auth/refresh`,
    { refreshToken: currentRefreshToken },
    { timeout: 15000, headers: { 'Content-Type': 'application/json' } },
  );

  await useAuthStore.getState().setTokens({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  });

  return data.accessToken;
}

/**
 * Garante refresh unico mesmo com varias requests em paralelo.
 * Limpa o singleton no settle (sucesso ou falha) pra permitir nova tentativa
 * futura quando o próximo access token expirar.
 */
function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/** Marca interna no config pra evitar retry infinito. */
type RetriableConfig = AxiosRequestConfig & { _retried?: boolean };

function isAuthBypass(url: string | undefined): boolean {
  if (!url) {
    return false;
  }
  return AUTH_BYPASS_PATHS.some((p) => url.endsWith(p));
}

// ---------- Response: normaliza erros + refresh em 401 ----------
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiErrorPayload>) => {
    const status = error.response?.status ?? 0;
    const payload = error.response?.data;
    const originalConfig = error.config as RetriableConfig | undefined;

    // 401: tentar refresh, exceto em endpoints de auth ou se já retentamos.
    const shouldTryRefresh =
      status === 401 &&
      originalConfig &&
      !originalConfig._retried &&
      !isAuthBypass(originalConfig.url) &&
      useAuthStore.getState().refreshToken !== null;

    if (shouldTryRefresh) {
      try {
        const newAccessToken = await refreshAccessToken();
        originalConfig._retried = true;
        // Garante header novo no retry — o request interceptor jah pegaria o
        // token do store, mas seteamos explicitamente pra robustez.
        originalConfig.headers = {
          ...originalConfig.headers,
          Authorization: `Bearer ${newAccessToken}`,
        };
        return apiClient.request(originalConfig);
      } catch {
        // Refresh falhou — derruba sessao e propaga como 401 mesmo.
        await useAuthStore.getState().signOut();
      }
    } else if (status === 401 && !isAuthBypass(originalConfig?.url)) {
      // 401 sem caminho de refresh viavel (sem refreshToken ou já retentou).
      await useAuthStore.getState().signOut();
    }

    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message ?? error.message ?? 'Erro de conexao';

    return Promise.reject(new ApiError(message, status, payload));
  },
);
