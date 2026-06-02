/**
 * Doses de hoje (atalho /dose-logs/today).
 *
 * staleTime curto (30s) — status pode mudar de PENDING pra atrasada
 * conforme o relogio anda.
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { doseLogsApi } from '../api/dose-logs.api';
import type { MedDoseLog } from '../types';

export function useTodayDoses(babyId: string | null | undefined) {
  return useQuery<MedDoseLog[]>({
    queryKey: qk.doseLogs.today(babyId ?? ''),
    queryFn: () => doseLogsApi.listToday(babyId as string),
    enabled: typeof babyId === 'string' && babyId.length > 0,
    staleTime: 1000 * 30, // 30s
  });
}
