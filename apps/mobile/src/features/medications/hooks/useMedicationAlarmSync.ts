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
 * Montado uma vez na arvore autenticada (AppNavigator), ao lado do
 * useFcmTokenSync.
 */

import { useEffect, useRef } from 'react';

import { useBabySelectorStore } from '@/features/babies/store/baby-selector.store';
import { snackbar } from '@/shared/feedback';

import { openExactAlarmSettings, syncMedicationAlarms } from '../alarms';
import { useMedications } from './useMedications';

export function useMedicationAlarmSync(): void {
  const selectedBabyId = useBabySelectorStore((s) => s.selectedBabyId);
  const { data } = useMedications(selectedBabyId);

  // So pede a permissao de alarme exato UMA vez por sessao, pra nao virar nag.
  const promptedExactRef = useRef(false);

  useEffect(() => {
    if (!selectedBabyId || !data) return;

    let cancelled = false;
    (async () => {
      try {
        const result = await syncMedicationAlarms(selectedBabyId, data);
        if (cancelled) return;

        if (result.needsExactPermission && !promptedExactRef.current) {
          promptedExactRef.current = true;
          snackbar.show(
            'Pra os remédios tocarem na hora exata, ative "Alarmes e lembretes" do BebeCare.',
            {
              variant: 'info',
              action: {
                label: 'Ativar',
                onPress: () => {
                  openExactAlarmSettings();
                },
              },
            },
          );
        }
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
