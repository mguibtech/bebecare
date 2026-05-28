/**
 * Lista consultas do bebe com filtro de scope (upcoming/past/all).
 *
 * staleTime curto (1min) — scope='upcoming' depende do tempo atual: uma
 * consulta que era "futura" pode virar "passada" depois de alguns minutos.
 */

import { useQuery } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';

import { appointmentsApi } from '../api/appointments.api';
import type { Appointment, AppointmentScope } from '../types';

export function useAppointments(
  babyId: string | null | undefined,
  scope: AppointmentScope = 'all',
) {
  return useQuery<Appointment[]>({
    queryKey: qk.appointments.list(babyId ?? '', scope),
    queryFn: () => appointmentsApi.list(babyId as string, { scope }),
    enabled: typeof babyId === 'string' && babyId.length > 0,
    staleTime: 1000 * 60, // 1min
  });
}
