/**
 * Agendamento dos despertadores (M7) via notifee — mesma estrategia do alarme
 * de remedio (M6): um trigger por (alarme x dia-da-semana), repeticao SEMANAL,
 * canal IMPORTANCE_HIGH com full-screen. Reagendamento pos-boot e automatico.
 *
 * Canal proprio ("Despertadores") pra separar de remedio nas configs do Android.
 * Logica pura (sem React) — chamada pelo useAlarmSync.
 */

import notifee, {
  AndroidCategory,
  AndroidImportance,
  AndroidVisibility,
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

import {
  WEEKDAY_INDEX,
  nextWeeklyOccurrenceMs,
  parseHhMm,
} from '@/shared/alarms/recurrence';

import { ALARM_CATEGORY_LABELS, daysFromMask, type Alarm } from './types';

const CHANNEL_ID = 'feeding-alarm';
const CHANNEL_NAME = 'Despertadores';
const ID_PREFIX = 'feed-alarm:';
const PRESS_ACTION_ID = 'default';

let channelEnsured = false;

async function ensureChannelOnce(): Promise<void> {
  if (channelEnsured) return;
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500, 300, 500],
    visibility: AndroidVisibility.PUBLIC,
  });
  channelEnsured = true;
}

function alarmNotificationId(alarmId: string, dayKey: string): string {
  return `${ID_PREFIX}${alarmId}:${dayKey}`;
}

async function scheduleOne(
  alarm: Alarm,
  dayKey: keyof typeof WEEKDAY_INDEX,
): Promise<void> {
  const { hour, minute } = parseHhMm(alarm.time);
  const timestamp = nextWeeklyOccurrenceMs(WEEKDAY_INDEX[dayKey], hour, minute);

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp,
    repeatFrequency: RepeatFrequency.WEEKLY,
    alarmManager: { allowWhileIdle: true },
  };

  await notifee.createTriggerNotification(
    {
      id: alarmNotificationId(alarm.id, dayKey),
      title: `${alarm.label} ⏰`,
      body: ALARM_CATEGORY_LABELS[alarm.category],
      android: {
        channelId: CHANNEL_ID,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        fullScreenAction: { id: PRESS_ACTION_ID, launchActivity: 'default' },
        pressAction: { id: PRESS_ACTION_ID, launchActivity: 'default' },
        autoCancel: true,
      },
      data: { type: 'feed-alarm', alarmId: alarm.id },
    },
    trigger,
  );
}

/** Cancela os trigger notifications de despertador (prefixo feed-alarm:). */
export async function cancelAllAlarms(): Promise<void> {
  const ids = await notifee.getTriggerNotificationIds();
  const mine = ids.filter((id) => id.startsWith(ID_PREFIX));
  await Promise.all(mine.map((id) => notifee.cancelTriggerNotification(id)));
}

/**
 * Reconcilia TODOS os despertadores locais a partir da lista. Cancela e
 * reagenda — idempotente. So agenda os ativos.
 */
export async function syncAlarms(alarms: Alarm[]): Promise<void> {
  await ensureChannelOnce();
  await cancelAllAlarms();

  for (const alarm of alarms) {
    if (!alarm.isActive) continue;
    for (const day of daysFromMask(alarm.daysOfWeekMask)) {
      try {
        await scheduleOne(alarm, day);
      } catch (err) {
        if (__DEV__) {
          console.warn('[feed-alarm] falha ao agendar', alarm.id, day, err);
        }
      }
    }
  }
}
