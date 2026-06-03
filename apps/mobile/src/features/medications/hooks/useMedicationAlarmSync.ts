/**
 * Mantem os alarmes locais (notifee) em sincronia com os medicamentos do bebe
 * selecionado.
 *
 * Por que aqui e nao nas mutations: a lista (`useMedications`) ja e invalidada
 * por todo CRUD de medicamento/schedule. Observando a lista, qualquer mudanca
 * (criar/editar/excluir remedio ou horario) converge os alarmes sem cada
 * mutation precisar conhecer o notifee. No launch, o primeiro fetch da lista
 * tambem dispara o sync — cobrindo "reagendar ao abrir o app".
 *
 * Este hook so RE-AGENDA (efeito de fundo). A UX de permissoes vive no momento
 * em que o usuario ativa um alarme (ScheduleEditorSheet -> promptAlarmPermissions),
 * pra nao disparar pedidos de permissao "do nada" no launch.
 *
 * Montado uma vez na arvore autenticada (AppNavigator), ao lado do
 * useFcmTokenSync.
 */

import { useEffect } from 'react';

import { useBabySelectorStore } from '@/features/babies/store/baby-selector.store';

import { syncMedicationAlarms } from '../alarms';
import { useMedications } from './useMedications';

export function useMedicationAlarmSync(): void {
  const selectedBabyId = useBabySelectorStore((s) => s.selectedBabyId);
  const { data } = useMedications(selectedBabyId);

  useEffect(() => {
    if (!selectedBabyId || !data) return;

    let cancelled = false;
    (async () => {
      try {
        await syncMedicationAlarms(selectedBabyId, data);
        if (cancelled) return;
      } catch (err) {
        // notifee indisponivel (ex.: app ainda nao rebuildado com o modulo
        // nativo, ou rodando em ambiente sem suporte). Mantem o app vivo.
        if (__DEV__) {
          console.warn('[med-alarm] sync falhou', err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedBabyId, data]);
}
