/**
 * Liga o toque na notificação de alarme à navegacao (M6/6D).
 *
 * Dois caminhos de entrada do notifee:
 *  1. App ABERTO/background → toque dispara EventType.PRESS no onForegroundEvent.
 *  2. App em QUIT, aberto PELO toque → getInitialNotification() devolve a
 *     notificação que lancou o app.
 *
 * (Acoes em background sem abrir o app — ex.: snooze — ficam no
 * onBackgroundEvent, registrado em alarms/background.ts.)
 *
 * Montado uma vez na arvore autenticada (AppNavigator).
 */

import { useEffect } from 'react';
import notifee, { EventType } from '@notifee/react-native';

import { routeFromAlarmNotification } from '../alarms';

export function useAlarmDeepLink(): void {
  useEffect(() => {
    // 1. App aberto pelo alarme (estado quit).
    (async () => {
      try {
        const initial = await notifee.getInitialNotification();
        if (initial) {
          routeFromAlarmNotification(initial.notification.data);
        }
      } catch {
        // notifee indisponivel (sem rebuild): ignora.
      }
    })();

    // 2. Toque com o app aberto/background.
    let unsubscribe = () => {};
    try {
      unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS) {
          routeFromAlarmNotification(detail.notification?.data);
        }
      });
    } catch {
      // ignora
    }

    return () => unsubscribe();
  }, []);
}
