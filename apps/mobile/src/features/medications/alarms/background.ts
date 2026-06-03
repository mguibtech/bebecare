/**
 * Handler de eventos do notifee em background/quit para os alarmes de remedio.
 *
 * DEVE ser registrado no escopo de modulo (index.js), fora da arvore React —
 * mesmo padrao do registerBackgroundHandler() do FCM. O notifee exige um
 * onBackgroundEvent registrado pra entregar eventos (e loga warning sem ele).
 *
 * Hoje o alarme so abre o app (pressAction/fullScreenAction com
 * launchActivity 'default'), entao nao ha trabalho a fazer aqui. Fica como
 * ponto de extensao pras acoes "Tomar" / "Soneca" (snooze) do M6/B8.
 */

import notifee, { EventType } from '@notifee/react-native';

export function registerAlarmBackgroundHandler(): void {
  // Guarda: roda no escopo de modulo (index.js). Se o modulo nativo do notifee
  // ainda nao estiver no build (antes do primeiro rebuild apos instalar), a
  // chamada lancaria e derrubaria o boot. O try/catch mantem o app vivo.
  try {
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      // Placeholder: PRESS ja abre a MainActivity via launchActivity.
      // Acoes de notificacao (snooze/tomar) serao tratadas aqui.
      if (type === EventType.ACTION_PRESS && detail.pressAction) {
        // TODO(M6/B8): tratar 'snooze' e 'take' quando os botoes forem adicionados.
      }
    });
  } catch {
    // notifee nativo indisponivel: ignora (push/alarme ficam inativos ate o build).
  }
}
