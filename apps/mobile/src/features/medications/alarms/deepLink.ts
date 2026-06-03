/**
 * Roteamento ao tocar numa notificacao de alarme de remedio (M6/6D).
 *
 * O alarme carrega `data: { type: 'med-alarm', babyId, medicationId, scheduleId }`
 * (ver scheduler.ts). Ao tocar, levamos o usuario pra aba "Hoje" — onde ele ve a
 * dose e marca como tomada. Antes disso o toque so abria a home.
 *
 * Logica pura (sem React): chamada pelos handlers do notifee em
 * useAlarmDeepLink. Usa o navigationRef pra navegar fora da arvore.
 */

import { navigationRef, whenNavigationReady } from '@/app/navigation/navigationRef';

/** Dados que o notifee anexa na notificacao (valores chegam como string). */
type NotificationData = Record<string, unknown> | undefined;

export function routeFromAlarmNotification(data: NotificationData): void {
  if (!data || data.type !== 'med-alarm') return;

  whenNavigationReady(() => {
    // Aba "Hoje" (doses do dia) — o lugar acionavel pra um lembrete de dose.
    navigationRef.navigate('MainTabs', { screen: 'Today' });
  });
}
