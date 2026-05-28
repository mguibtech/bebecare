/**
 * Catalogo PNI completo.
 *
 * StaleTime longo (24h): o catalogo do PNI nao muda no ar — atualizacoes
 * sao raras e vem via deploy do backend. Mobile pode reusar o cache por
 * muito tempo sem fetch desnecessario.
 *
 * gcTime tambem longo (7 dias): mesmo que o user feche e reabra o app,
 * o React Query persiste em memoria entre navegacoes.
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { useAuthStore } from '@/features/auth/store/auth.store';

import { vaccinesApi } from '../api/vaccines.api';
import type { Vaccine } from '../types';

export function useVaccineCatalog() {
  const status = useAuthStore((s) => s.status);

  return useQuery<Vaccine[]>({
    queryKey: qk.vaccines.catalog(),
    queryFn: () => vaccinesApi.getCatalog(),
    enabled: status === 'authenticated',
    staleTime: 1000 * 60 * 60 * 24, // 24h
    gcTime: 1000 * 60 * 60 * 24 * 7, // 7 dias
  });
}
