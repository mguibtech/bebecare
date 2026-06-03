/**
 * Ref global do NavigationContainer.
 *
 * Permite navegar de FORA da arvore React — ex.: ao tocar numa notificacao de
 * alarme (handler do notifee roda fora dos componentes). Anexado ao
 * NavigationContainer no RootNavigator.
 */

import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef =
  createNavigationContainerRef<ReactNavigation.RootParamList>();

/**
 * Executa `fn` assim que o container estiver pronto.
 *
 * - Toque na notificacao com o app ABERTO/background: o container ja esta pronto,
 *   roda na hora.
 * - App ABERTO pelo toque (estado quit, via getInitialNotification): o container
 *   pode montar 1-2 frames depois — tentamos de novo por ate ~1s e desistimos.
 */
export function whenNavigationReady(fn: () => void): void {
  let attempts = 0;
  const run = () => {
    if (navigationRef.isReady()) {
      fn();
      return;
    }
    if (attempts >= 10) return;
    attempts += 1;
    setTimeout(run, 100);
  };
  run();
}
