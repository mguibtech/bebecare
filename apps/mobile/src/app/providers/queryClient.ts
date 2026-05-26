import { QueryClient } from '@tanstack/react-query';

import { env } from '@/shared/config/env';

/**
 * QueryClient unico para todo o app.
 * - retry: 1 (mobile costuma ter rede instavel, mas evita amplificar erros)
 * - staleTime: 5min para reduzir refetch desnecessario
 * - refetchOnWindowFocus: false (nao aplicavel ao RN, mas explicito)
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: env.QUERY_STALE_TIME,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
