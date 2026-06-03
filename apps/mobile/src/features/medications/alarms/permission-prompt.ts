/**
 * Guiao just-in-time de permissoes do alarme.
 *
 * Chamado logo apos o usuario salvar um horario com "Alarme local" ligado — o
 * momento em que a intencao esta clara. Mostra NO MAXIMO uma orientacao por vez,
 * priorizada da mais critica pra menos:
 *
 *   1. Notificacao negada  -> alarme nao aparece. Bloqueante. (erro + ajustes)
 *   2. Alarme exato off    -> dispara atrasado. (info + ativar)
 *   3. Dica de tela cheia   -> abre como heads-up, nao em tela cheia. (dica, 1x)
 *
 * Sem isso, o alarme falharia silenciosamente pra um usuario real (foi o que
 * vimos no device: POST_NOTIFICATIONS vinha negada).
 */

import { snackbar } from '@/shared/feedback';

import {
  ensureAlarmPermissions,
  openExactAlarmSettings,
  openFullScreenIntentSettings,
  openNotificationSettings,
} from './permission';

// A dica de tela cheia nao da pra detectar (notifee nao expoe o estado), entao
// mostramos no maximo uma vez por sessao pra nao virar nag.
let fullScreenTipShown = false;

export async function promptAlarmPermissions(): Promise<void> {
  let status;
  try {
    status = await ensureAlarmPermissions();
  } catch {
    // notifee indisponivel (app sem rebuild): nao tem o que pedir.
    return;
  }

  if (!status.notifications) {
    snackbar.show('Ative as notificações pra o alarme do remédio tocar.', {
      variant: 'error',
      action: {
        label: 'Abrir ajustes',
        onPress: () => {
          openNotificationSettings();
        },
      },
    });
    return;
  }

  if (!status.exactAlarm) {
    snackbar.show('Pra tocar na hora exata, ative "Alarmes e lembretes".', {
      variant: 'info',
      action: {
        label: 'Ativar',
        onPress: () => {
          openExactAlarmSettings();
        },
      },
    });
    return;
  }

  if (!fullScreenTipShown) {
    fullScreenTipShown = true;
    snackbar.show(
      'Dica: pra o alarme abrir em tela cheia na tela bloqueada, ative "tela cheia" nas configurações.',
      {
        variant: 'info',
        action: {
          label: 'Abrir',
          onPress: () => {
            openFullScreenIntentSettings();
          },
        },
      },
    );
  }
}
