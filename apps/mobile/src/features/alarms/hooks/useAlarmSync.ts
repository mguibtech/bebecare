/**
 * Mantem os despertadores locais (notifee) em sincronia com a lista do backend.
 *
 * Observa a lista (inválida a cada CRUD) e reagenda. No launch também dispara.
 * So re-agenda (efeito de fundo) — a UX de permissão vive no save do form
 * (promptAlarmPermissions, reusado do M6). Montado uma vez no AppNavigator.
 */

import { useEffect } from 'react';

import { syncAlarms } from '../notifee';
import { useAlarms } from './useAlarms';

export function useAlarmSync(): void {
  const { data } = useAlarms();

  useEffect(() => {
    if (!data) return;
    let cancelled = false;
    (async () => {
      try {
        await syncAlarms(data);
        if (cancelled) return;
      } catch (err) {
        if (__DEV__) {
          console.warn('[feed-alarm] sync falhou', err);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data]);
}
