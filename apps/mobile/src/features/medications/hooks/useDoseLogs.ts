/**
 * Lista de dose logs filtrada (status / date range).
 * Usado em telas de historico ou paginas detalhadas por dia.
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { doseLogsApi } from '../api/dose-logs.api';
import type { DoseLogFilter, DoseStatus, MedDoseLog } from '../types';

export function useDoseLogs(
  babyId: string | null | undefined,
  filter: DoseLogFilter = {},
) {
  // Identifica unicamente o scope de filtro pro queryKey.
  const scope = `${filter.status ?? 'any'}-${filter.from ?? ''}-${filter.to ?? ''}`;

  return useQuery<MedDoseLog[]>({
    queryKey: qk.doseLogs.list(babyId ?? '', scope),
    queryFn: () => doseLogsApi.list(babyId as string, filter),
    enabled: typeof babyId === 'string' && babyId.length > 0,
    staleTime: 1000 * 60, // 1 min
  });
}

/** Variantes pra status especifico — wrapper convencional. */
export function useDoseLogsByStatus(
  babyId: string | null | undefined,
  status: DoseStatus,
) {
  return useDoseLogs(babyId, { status });
}
