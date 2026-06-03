/**
 * Constantes compartilhadas dos alarmes locais de remedio (notifee, M6/B8).
 */

/** Canal de notificacao Android dedicado aos alarmes de remedio. */
export const ALARM_CHANNEL_ID = 'med-alarm';
export const ALARM_CHANNEL_NAME = 'Alarmes de remédio';

/**
 * Prefixo dos ids dos trigger notifications agendados por esta feature.
 * Permite cancelar/sincronizar APENAS os alarmes de remedio sem tocar em
 * outras notificacoes agendadas (ex.: futuros alarmes de mamada — M7).
 *
 * Estrutura do id: `med-alarm:<babyId>:<scheduleId>:<dayKey>`. O babyId no
 * prefixo permite reconciliar os alarmes de UM bebe sem apagar os de outro
 * bebe da mesma familia (familias com 2+ bebes).
 */
export const ALARM_ID_PREFIX = 'med-alarm:';

/**
 * pressAction / fullScreenAction id. 'default' faz o notifee abrir a
 * MainActivity quando o usuario toca/abre o alarme.
 */
export const ALARM_PRESS_ACTION_ID = 'default';

/** Prefixo dos ids de um bebe especifico (pra cancelar so os dele). */
export function alarmIdPrefixForBaby(babyId: string): string {
  return `${ALARM_ID_PREFIX}${babyId}:`;
}

/** Monta o id deterministico de um alarme (baby + schedule + dia da semana). */
export function alarmNotificationId(
  babyId: string,
  scheduleId: string,
  dayKey: string,
): string {
  return `${alarmIdPrefixForBaby(babyId)}${scheduleId}:${dayKey}`;
}
