/**
 * Nucleo do agendamento de alarmes locais de remedio (notifee, M6/B8).
 *
 * Estrategia: um trigger notification por (schedule, dia-da-semana ativo), com
 * repeticao SEMANAL. Ex.: um schedule "08:00, seg/qua/sex" vira 3 alarmes
 * semanais. O notifee persiste os triggers e os re-registra sozinho apos
 * reboot (graças a RECEIVE_BOOT_COMPLETED no manifest), entao nao precisamos de
 * um BroadcastReceiver proprio.
 *
 * Idempotencia: syncMedicationAlarms() cancela TODOS os alarmes desta feature e
 * recria a partir do estado atual. Assim qualquer CRUD de medicamento/schedule
 * converge pro conjunto correto sem rastrear diffs.
 */

import notifee, {
  AndroidCategory,
  AndroidImportance,
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

import {
  DOSE_UNIT_LABELS,
  daysFromMask,
  type DayKey,
  type MedSchedule,
  type Medication,
} from '../types';
import { ensureAlarmChannelOnce } from './channel';
import { canScheduleExactAlarms } from './permission';
import {
  ALARM_CHANNEL_ID,
  ALARM_ID_PREFIX,
  ALARM_PRESS_ACTION_ID,
  alarmIdPrefixForBaby,
  alarmNotificationId,
} from './constants';

/** DayKey -> indice do Date.getDay() (dom=0 ... sab=6). */
const DAY_KEY_TO_WEEKDAY: Record<DayKey, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':');
  return { hour: Number(h), minute: Number(m) };
}

/**
 * Proximo timestamp (ms) que cai no `weekday` no horario `hour:minute`.
 * Se for hoje mas o horario ja passou, pula pra semana seguinte — assim o
 * primeiro disparo nunca e "imediato/atrasado".
 */
function nextOccurrenceMs(
  weekday: number,
  hour: number,
  minute: number,
  from: Date = new Date(),
): number {
  const d = new Date(from.getTime());
  d.setHours(hour, minute, 0, 0);
  let dayDiff = (weekday - d.getDay() + 7) % 7;
  if (dayDiff === 0 && d.getTime() <= from.getTime()) {
    dayDiff = 7;
  }
  d.setDate(d.getDate() + dayDiff);
  return d.getTime();
}

function doseSummary(med: Medication): string {
  const unit = DOSE_UNIT_LABELS[med.doseUnit] ?? '';
  // med.dose vem como decimal string do backend ("20.000"). No pt-BR o ponto e
  // separador de milhar, entao "20.000 ml" parece 20 mil — Number() normaliza
  // pra "20" (mesmo padrao de MedicationCard/DoseCard/Detail).
  return `${med.name} — ${Number(med.dose)} ${unit}`.trim();
}

/**
 * Agenda UM alarme (schedule + dia). `exact` controla se usa o AlarmManager
 * (preciso, fura o Doze) ou cai no agendamento inexato quando a permissao de
 * alarme exato nao foi concedida — assim nunca lanca por falta de permissao.
 */
async function scheduleOne(
  med: Medication,
  schedule: MedSchedule,
  day: DayKey,
  exact: boolean,
): Promise<void> {
  const { hour, minute } = parseTime(schedule.time);
  const timestamp = nextOccurrenceMs(DAY_KEY_TO_WEEKDAY[day], hour, minute);

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp,
    repeatFrequency: RepeatFrequency.WEEKLY,
    ...(exact ? { alarmManager: { allowWhileIdle: true } } : {}),
  };

  await notifee.createTriggerNotification(
    {
      id: alarmNotificationId(med.babyId, schedule.id, day),
      title: 'Hora do remédio 💊',
      body: doseSummary(med),
      android: {
        channelId: ALARM_CHANNEL_ID,
        category: AndroidCategory.ALARM,
        importance: AndroidImportance.HIGH,
        // Abre o app por cima da lockscreen, como um despertador.
        fullScreenAction: { id: ALARM_PRESS_ACTION_ID, launchActivity: 'default' },
        pressAction: { id: ALARM_PRESS_ACTION_ID, launchActivity: 'default' },
        autoCancel: true,
      },
      data: {
        type: 'med-alarm',
        babyId: med.babyId,
        medicationId: med.id,
        scheduleId: schedule.id,
      },
    },
    trigger,
  );
}

/** Cancela os trigger notifications cujo id casa com `prefix`. */
async function cancelByPrefix(prefix: string): Promise<void> {
  const ids = await notifee.getTriggerNotificationIds();
  const mine = ids.filter((id) => id.startsWith(prefix));
  await Promise.all(mine.map((id) => notifee.cancelTriggerNotification(id)));
}

/**
 * Cancela TODOS os alarmes de remedio de TODOS os bebes (prefixo med-alarm:).
 * Usado no logout pra nao deixar alarmes orfaos da conta anterior.
 */
export async function cancelAllMedicationAlarms(): Promise<void> {
  await cancelByPrefix(ALARM_ID_PREFIX);
}

export type AlarmSyncResult = {
  /** Quantos alarmes (schedule x dia) ficaram agendados. */
  scheduledCount: number;
  /**
   * true quando existem alarmes ativos mas a permissao de alarme exato esta
   * revogada (Android 12+). O chamador decide se manda o usuario pro sistema.
   */
  needsExactPermission: boolean;
};

/**
 * Reconcilia os alarmes locais de UM bebe a partir da lista de medicamentos
 * dele. Cancela os alarmes desse bebe e reagenda — idempotente e seguro de
 * chamar a cada mudanca na lista (ou no launch). Alarmes de OUTROS bebes da
 * familia ficam intactos.
 *
 * So agenda para schedules com `useAlarm && isActive` de medicamentos ativos.
 */
export async function syncMedicationAlarms(
  babyId: string,
  medications: Medication[],
): Promise<AlarmSyncResult> {
  await ensureAlarmChannelOnce();
  await cancelByPrefix(alarmIdPrefixForBaby(babyId));

  const exact = await canScheduleExactAlarms();
  let scheduledCount = 0;

  for (const med of medications) {
    if (!med.isActive) continue;
    for (const schedule of med.schedules) {
      if (!schedule.useAlarm || !schedule.isActive) continue;
      for (const day of daysFromMask(schedule.daysOfWeekMask)) {
        try {
          await scheduleOne(med, schedule, day, exact);
          scheduledCount += 1;
        } catch (err) {
          // Um alarme que falha (ex.: trigger no passado por race) nao deve
          // abortar o sync inteiro. Loga e segue.
          if (__DEV__) {
            console.warn('[med-alarm] falha ao agendar', schedule.id, day, err);
          }
        }
      }
    }
  }

  return {
    scheduledCount,
    needsExactPermission: scheduledCount > 0 && !exact,
  };
}
