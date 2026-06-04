/**
 * Actions em um DoseLog: take / skip / reset.
 *
 * Cada mutation inválida todas as queries de doseLogs do bebê (today + lista
 * + filtradas) — UI reflete instantaneamente.
 *
 * Snackbar success em take/skip; show simples em reset (eh acao "voltar atras").
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { qk } from '@/shared/api/queryKeys';
import { snackbar } from '@/shared/feedback';

import { doseLogsApi } from '../api/dose-logs.api';
import type { MedDoseLog, SkipDoseBody } from '../types';

type TakeArgs = { babyId: string; id: string };

export function useTakeDose() {
  const queryClient = useQueryClient();
  return useMutation<MedDoseLog, Error, TakeArgs>({
    mutationFn: ({ babyId, id }) => doseLogsApi.take(babyId, id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: qk.doseLogs.all });
      snackbar.showSuccess(`${data.medication.name} marcada como tomada`);
    },
  });
}

type SkipArgs = { babyId: string; id: string; body: SkipDoseBody };

export function useSkipDose() {
  const queryClient = useQueryClient();
  return useMutation<MedDoseLog, Error, SkipArgs>({
    mutationFn: ({ babyId, id, body }) =>
      doseLogsApi.skip(babyId, id, body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: qk.doseLogs.all });
      snackbar.show(`${data.medication.name} pulada`);
    },
  });
}

type ResetArgs = { babyId: string; id: string };

export function useResetDose() {
  const queryClient = useQueryClient();
  return useMutation<MedDoseLog, Error, ResetArgs>({
    mutationFn: ({ babyId, id }) => doseLogsApi.reset(babyId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qk.doseLogs.all });
      snackbar.show('Dose voltou pra pendente');
    },
  });
}
