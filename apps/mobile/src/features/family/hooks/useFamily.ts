/**
 * Hook que retorna detalhes da familia atual (membros + convites).
 *
 * Soh roda quando autenticado. Cache compartilhado pra evitar re-fetch
 * em telas que precisam do mesmo dado (FamilyScreen, MoreScreen).
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { useAuthStore } from '@/features/auth/store/auth.store';

import { familyApi } from '../api/family.api';
import type { FamilyDetails } from '../types';

export function useFamily() {
  const status = useAuthStore((s) => s.status);

  return useQuery<FamilyDetails>({
    queryKey: qk.family.me(),
    queryFn: () => familyApi.getMe(),
    enabled: status === 'authenticated',
  });
}
