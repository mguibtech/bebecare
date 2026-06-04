/**
 * Constantes compartilhadas dos alarmes locais de remédio (notifee, M6/B8).
 */

/** Canal de notificação Android dedicado aos alarmes de remédio. */
export const ALARM_CHANNEL_ID = 'med-alarm';
export const ALARM_CHANNEL_NAME = 'Alarmes de remédio';

/**
 * Prefixo dos ids dos trigger notifications agendados por esta feature.
 * Permite cancelar/sincronizar APENAS os alarmes de remédio sem tocar em
 * outras notificações agendadas (ex.: futuros alarmes de mamada — M7).
 *
 * Estrutura do id: `med-alarm:<babyId>:<scheduleId>:<dayKey>`. O babyId no
 * prefixo permite reconciliar os alarmes de UM bebê sem apagar os de outro
 * bebê da mesma família (famílias com 2+ bebês).
 */
export const ALARM_ID_PREFIX = 'med-alarm:';

/**
 * pressAction / fullScreenAction id. 'default' faz o notifee abrir a
 * MainActivity quando o usuário toca/abre o alarme.
 */
export const ALARM_PRESS_ACTION_ID = 'default';

/** Prefixo dos ids de um bebê específico (pra cancelar so os dele). */
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
