/**
 * Canal de notificação Android dos alarmes de remédio.
 *
 * IMPORTANCE.HIGH = heads-up + som; combinado com category ALARM e
 * fullScreenAction (ver scheduler.ts), o alarme se comporta como um
 * despertador: toca por cima da lockscreen mesmo com o app fechado.
 *
 * O canal precisa existir ANTES de agendar qualquer trigger. createChannel e
 * idempotente (recriar com o mesmo id so atualiza), entao chamamos sempre antes
 * de agendar.
 */

import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';

import { ALARM_CHANNEL_ID, ALARM_CHANNEL_NAME } from './constants';

let channelEnsured = false;

export async function ensureAlarmChannel(): Promise<void> {
  await notifee.createChannel({
    id: ALARM_CHANNEL_ID,
    name: ALARM_CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
    // Som padrao do sistema. Som customizado por categoria fica pro M7
    // (despertador da mamada) quando os assets de áudio entrarem.
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    // Mostra conteudo completo na lockscreen (e um lembrete, não dado sensivel).
    visibility: AndroidVisibility.PUBLIC,
    bypassDnd: false,
  });
  channelEnsured = true;
}

/** Garante o canal apenas uma vez por sessao (cache em memoria). */
export async function ensureAlarmChannelOnce(): Promise<void> {
  if (channelEnsured) return;
  await ensureAlarmChannel();
}
