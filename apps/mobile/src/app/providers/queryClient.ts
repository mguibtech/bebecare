import { QueryClient } from '@tanstack/react-query';

import { env } from '@/shared/config/env';

/**
 * QueryClient unico para todo o app.
 * - retry: 2 (mobile tem rede instavel; ainda evita amplificar erros reais)
 * - staleTime: 5min para reduzir refetch desnecessario
 * - refetchOnWindowFocus: true — combinado com o focusManager+AppState ligado em
 *   AppProviders, faz queries com erro/stale se recuperarem sozinhas quando o app
 *   volta pro foreground. Sem isso, uma falha transitoria de rede deixa a query
 *   travada no erro ate o app ser reaberto (ex: tela "Mais" so com botao Sair).
 * - refetchOnReconnect: true — explicito (so dispara com onlineManager+NetInfo,
 *   ainda não instalado; o foreground cobre o caso comum por enquanto).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: env.QUERY_STALE_TIME,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
