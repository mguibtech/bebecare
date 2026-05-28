/**
 * Schedule de vacinas de UM bebe especifico, com status calculado pelo backend.
 *
 * StaleTime curto (1 min): status depende da idade do bebe e do tempo atual —
 * uma dose que e "DUE hoje" vira "OVERDUE amanha". Cache curto evita exibir
 * status desatualizado.
 *
 * Soh roda se babyId for valido (string nao vazia).
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { vaccinesApi } from '../api/vaccines.api';
import type { BabyVaccineSchedule } from '../types';

export function useBabyVaccineSchedule(babyId: string | null | undefined) {
  return useQuery<BabyVaccineSchedule>({
    queryKey: qk.vaccines.schedule(babyId ?? ''),
    queryFn: () => vaccinesApi.getScheduleForBaby(babyId as string),
    enabled: typeof babyId === 'string' && babyId.length > 0,
    staleTime: 1000 * 60, // 1 min
  });
}
