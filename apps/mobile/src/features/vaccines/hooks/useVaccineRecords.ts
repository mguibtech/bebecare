/**
 * Historico de doses aplicadas do bebe.
 *
 * Soh roda se babyId valido. Cache compartilhado com schedule via invalidate
 * em mutations (useCreateVaccineRecord etc invalida ambos).
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { vaccineRecordsApi } from '../api/vaccine-records.api';
import type { VaccineRecord } from '../types';

export function useVaccineRecords(babyId: string | null | undefined) {
  return useQuery<VaccineRecord[]>({
    queryKey: qk.vaccines.records(babyId ?? ''),
    queryFn: () => vaccineRecordsApi.list(babyId as string),
    enabled: typeof babyId === 'string' && babyId.length > 0,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
