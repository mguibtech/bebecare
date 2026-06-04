/**
 * Detalhe de uma consulta específica.
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { appointmentsApi } from '../api/appointments.api';
import type { Appointment } from '../types';

export function useAppointment(
  babyId: string | null | undefined,
  id: string | null | undefined,
) {
  return useQuery<Appointment>({
    queryKey: qk.appointments.detail(babyId ?? '', id ?? ''),
    queryFn: () =>
      appointmentsApi.getOne(babyId as string, id as string),
    enabled:
      typeof babyId === 'string' &&
      babyId.length > 0 &&
      typeof id === 'string' &&
      id.length > 0,
  });
}
