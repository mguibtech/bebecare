/**
 * Lista os despertadores do usuário logado.
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { alarmsApi } from '../api/alarms.api';
import type { Alarm } from '../types';

export function useAlarms() {
  return useQuery<Alarm[]>({
    queryKey: qk.alarms.list(),
    queryFn: () => alarmsApi.list(),
    staleTime: 1000 * 60 * 5,
  });
}
