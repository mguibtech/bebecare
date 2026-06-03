/**
 * Toque na notificacao de despertador (type=feed-alarm) abre a tela de
 * Despertadores. Mesmo padrao do deep-link de remedio (M6/6D): onForegroundEvent
 * (PRESS) + getInitialNotification (app aberto pelo toque no quit).
 *
 * Coexiste com o useAlarmDeepLink de medications — cada hook filtra pelo seu
 * proprio `type`, ignorando o do outro.
 */

import { useEffect } from 'react';
import notifee, { EventType } from '@notifee/react-native';

import {
  navigationRef,
  whenNavigationReady,
} from '@/app/navigation/navigationRef';

function routeFromFeedAlarm(data?: Record<string, unknown>): void {
  if (!data || data.type !== 'feed-alarm') return;
  whenNavigationReady(() => {
    navigationRef.navigate('Alarms');
  });
}

export function useAlarmDeepLink(): void {
  useEffect(() => {
    (async () => {
      try {
        const initial = await notifee.getInitialNotification();
        if (initial) routeFromFeedAlarm(initial.notification.data);
      } catch {
        // notifee indisponivel: ignora.
      }
    })();

    let unsubscribe = () => {};
    try {
      unsubscribe = notifee.onForegroundEvent(({ type, detail }) => {
        if (type === EventType.PRESS) {
          routeFromFeedAlarm(detail.notification?.data);
        }
      });
    } catch {
      // ignora
    }
    return () => unsubscribe();
  }, []);
}
