/**
 * Soneca de uma dose (M6/B8).
 *
 * Diferente dos alarmes recorrentes (scheduler.ts), a soneca e um disparo
 * UNICO em "agora + N min" pra uma dose específica do dia. Reutiliza o mesmo
 * canal/visual de alarme. Re-sonecar a mesma dose substitui o agendamento
 * anterior (id deterministico por dose).
 */

import notifee, {
  AndroidCategory,
  AndroidImportance,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

import i18n from '@/shared/i18n';

import { DOSE_UNIT_KEYS, type MedDoseLog } from '../types';
import { ensureAlarmChannelOnce } from './channel';
import {
  ALARM_CHANNEL_ID,
  ALARM_ID_PREFIX,
  ALARM_PRESS_ACTION_ID,
} from './constants';

/** Intervalo padrao da soneca, em minutos. */
export const DEFAULT_SNOOZE_MINUTES = 10;

const SNOOZE_ID_PREFIX = `${ALARM_ID_PREFIX}snooze:`;

/** Agenda um lembrete unico pra `minutes` a frente, pra esta dose. */
export async function snoozeDose(
  dose: MedDoseLog,
  minutes: number = DEFAULT_SNOOZE_MINUTES,
): Promise<void> {
  await ensureAlarmChannelOnce();

  const med = dose.medication;
  const unit = i18n.t(DOSE_UNIT_KEYS[med.doseUnit]);
  const timestamp = Date.now() + minutes * 60_000;

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp,
    alarmManager: { allowWhileIdle: true },
  };

  await notifee.createTriggerNotification(
    {
      id: `${SNOOZE_ID_PREFIX}${dose.id}`,
      title: i18n.t('meds.alarmTitleSnooze'),
      body: `${med.name} — ${Number(med.dose)} ${unit}`.trim(),
      android: {
        channelId: ALARM_CHANNEL_ID,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        fullScreenAction: {
          id: ALARM_PRESS_ACTION_ID,
          launchActivity: 'default',
        },
        pressAction: { id: ALARM_PRESS_ACTION_ID, launchActivity: 'default' },
        autoCancel: true,
      },
      // Mesmo payload do alarme normal → o deep-link (6D) abre a aba "Hoje".
      data: {
        type: 'med-alarm',
        babyId: dose.babyId,
        medicationId: med.id,
        scheduleId: dose.scheduleId,
      },
    },
    trigger,
  );
}
