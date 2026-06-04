/**
 * Lista de medicamentos do bebê (com schedules embarcados).
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { medicationsApi } from '../api/medications.api';
import type { Medication } from '../types';

export function useMedications(babyId: string | null | undefined) {
  return useQuery<Medication[]>({
    queryKey: qk.medications.list(babyId ?? ''),
    queryFn: () => medicationsApi.list(babyId as string),
    enabled: typeof babyId === 'string' && babyId.length > 0,
    staleTime: 1000 * 60 * 5, // 5 min
  });
}
