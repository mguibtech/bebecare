/**
 * Hook do bebê individual. Soh roda quando id eh string não-vazia.
 *
 * Cache compartilhado com useBabies — quando useBabies traz a lista,
 * o useBaby pode aproveitar via `initialData` selecionando da lista.
 * Por enquanto, fetcha do servidor; otimizacao fica pra depois.
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { babiesApi } from '../api/babies.api';
import type { Baby } from '../types';

export function useBaby(id: string | null | undefined) {
  return useQuery<Baby>({
    queryKey: qk.babies.detail(id ?? ''),
    queryFn: () => babiesApi.getOne(id as string),
    enabled: typeof id === 'string' && id.length > 0,
  });
}
