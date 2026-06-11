/**
 * Guiao just-in-time de permissões do alarme.
 *
 * Chamado logo apos o usuário salvar um horário com "Alarme local" ligado — o
 * momento em que a intencao esta clara. Mostra NO MAXIMO uma orientacao por vez,
 * priorizada da mais critica pra menos:
 *
 *   1. Notificacao negada  -> alarme não aparece. Bloqueante. (erro + ajustes)
 *   2. Alarme exato off    -> dispara atrasado. (info + ativar)
 *   3. Dica de tela cheia   -> abre como heads-up, não em tela cheia. (dica, 1x)
 *
 * Sem isso, o alarme falharia silenciosamente pra um usuário real (foi o que
 * vimos no device: POST_NOTIFICATIONS vinha negada).
 */

import { snackbar } from '@/shared/feedback';
import i18n from '@/shared/i18n';
import { kv } from '@/shared/storage/mmkv';

import {
  ensureAlarmPermissions,
  openExactAlarmSettings,
  openFullScreenIntentSettings,
  openNotificationSettings,
} from './permission';

// A dica de tela cheia não da pra detectar (notifee não expoe o estado), entao
// mostramos no máximo UMA vez na vida do app (persistido) pra não incomodar quem
// já ativou — diferente das outras, que reaparecem enquanto a permissão faltar.
const FULL_SCREEN_TIP_KEY = 'med-alarm.fullScreenTipShown';

export async function promptAlarmPermissions(): Promise<void> {
  let status;
  try {
    status = await ensureAlarmPermissions();
  } catch {
    // notifee indisponivel (app sem rebuild): não tem o que pedir.
    return;
  }

  if (!status.notifications) {
    snackbar.show(i18n.t('feedback.permNotifications'), {
      variant: 'error',
      action: {
        label: i18n.t('feedback.permNotificationsAction'),
        onPress: () => {
          openNotificationSettings();
        },
      },
    });
    return;
  }

  if (!status.exactAlarm) {
    snackbar.show(i18n.t('feedback.permExact'), {
      variant: 'info',
      action: {
        label: i18n.t('feedback.permExactAction'),
        onPress: () => {
          openExactAlarmSettings();
        },
      },
    });
    return;
  }

  if (!kv.getBool(FULL_SCREEN_TIP_KEY)) {
    kv.setBool(FULL_SCREEN_TIP_KEY, true);
    snackbar.show(
      i18n.t('feedback.permFullScreen'),
      {
        variant: 'info',
        action: {
          label: i18n.t('feedback.permFullScreenAction'),
          onPress: () => {
            openFullScreenIntentSettings();
          },
        },
      },
    );
  }
}
