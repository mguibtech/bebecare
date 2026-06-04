/**
 * Hook que expoe o perfil do usuário logado (GET /auth/me).
 *
 * - Soh roda quando status === 'authenticated' (evita request com 401 garantido
 *   durante boot/logout).
 * - staleTime longo (padrao do queryClient = 5min) — perfil quase nunca muda.
 * - Quando o auth.store derruba sessao, o RootNavigator desmonta o app stack,
 *   logo não precisa invalidar manualmente aqui.
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { authApi } from '../api/auth.api';
import { useAuthStore } from '../store/auth.store';
import type { MeResponse } from '../types';

export function useMe() {
  const status = useAuthStore((s) => s.status);

  return useQuery<MeResponse>({
    queryKey: qk.auth.me(),
    queryFn: () => authApi.me(),
    enabled: status === 'authenticated',
  });
}
