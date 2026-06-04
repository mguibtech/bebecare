/**
 * Detalhe de um medicamento específico (com schedules).
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { medicationsApi } from '../api/medications.api';
import type { Medication } from '../types';

export function useMedication(
  babyId: string | null | undefined,
  id: string | null | undefined,
) {
  return useQuery<Medication>({
    queryKey: qk.medications.detail(babyId ?? '', id ?? ''),
    queryFn: () =>
      medicationsApi.getOne(babyId as string, id as string),
    enabled:
      typeof babyId === 'string' &&
      babyId.length > 0 &&
      typeof id === 'string' &&
      id.length > 0,
  });
}
