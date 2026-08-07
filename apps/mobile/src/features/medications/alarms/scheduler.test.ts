/**
 * Testes do agendador de alarmes locais de remédio.
 *
 * O notifee já vem mockado globalmente (jest.setup.js); aqui só inspecionamos
 * as chamadas. A permissão de alarme exato é mockada localmente pra controlar
 * os dois caminhos (exato vs. inexato) sem depender de Platform.
 */
import notifee, {
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';

import i18n from '@/shared/i18n';

import { DoseUnit, type MedSchedule, type Medication } from '../types';
import { canScheduleExactAlarms } from './permission';
import { cancelAllMedicationAlarms, syncMedicationAlarms } from './scheduler';

jest.mock('./permission', () => ({
  canScheduleExactAlarms: jest.fn(async () => true),
}));

const createTrigger = jest.mocked(notifee.createTriggerNotification);
const getTriggerIds = jest.mocked(notifee.getTriggerNotificationIds);
const cancelTrigger = jest.mocked(notifee.cancelTriggerNotification);
const canExact = jest.mocked(canScheduleExactAlarms);

// Âncora determinística: quarta-feira, 05/08/2026 10:00 local.
const NOW = new Date(2026, 7, 5, 10, 0, 0);

function makeSchedule(over: Partial<MedSchedule> = {}): MedSchedule {
  return {
    id: 'sch-1',
    time: '12:30',
    daysOfWeekMask: 8, // qua
    daysOfWeekNames: [],
    useAlarm: true,
    isActive: true,
    ...over,
  };
}

function makeMedication(over: Partial<Medication> = {}): Medication {
  return {
    id: 'med-1',
    babyId: 'baby-1',
    familyId: 'fam-1',
    name: 'Vitamina D',
    dose: '2.000',
    doseUnit: DoseUnit.DROP,
    instructions: null,
    startDate: '2026-08-01',
    endDate: null,
    isActive: true,
    schedules: [makeSchedule()],
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...over,
  };
}

/** Notificação passada na i-ésima chamada do createTriggerNotification. */
function notificationAt(index: number) {
  const call = createTrigger.mock.calls[index];
  if (!call) {
    throw new Error(`createTriggerNotification não foi chamado ${index + 1}x`);
  }
  return call[0];
}

/** Trigger passado na i-ésima chamada do createTriggerNotification. */
function triggerAt(index: number): TimestampTrigger {
  const call = createTrigger.mock.calls[index];
  if (!call) {
    throw new Error(`createTriggerNotification não foi chamado ${index + 1}x`);
  }
  return call[1] as TimestampTrigger;
}

beforeAll(async () => {
  await i18n.changeLanguage('pt');
});

beforeEach(() => {
  jest.clearAllMocks();
  canExact.mockResolvedValue(true);
  jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('syncMedicationAlarms', () => {
  it('agenda um alarme semanal por (schedule × dia ativo), com id determinístico', async () => {
    const med = makeMedication({
      schedules: [makeSchedule({ daysOfWeekMask: 62 })], // seg a sex
    });

    const result = await syncMedicationAlarms('baby-1', [med]);

    expect(result.scheduledCount).toBe(5);
    expect(result.needsExactPermission).toBe(false);
    expect(createTrigger.mock.calls.map((c) => c[0].id)).toEqual([
      'med-alarm:baby-1:sch-1:mon',
      'med-alarm:baby-1:sch-1:tue',
      'med-alarm:baby-1:sch-1:wed',
      'med-alarm:baby-1:sch-1:thu',
      'med-alarm:baby-1:sch-1:fri',
    ]);
  });

  it('horário ainda no futuro hoje -> dispara hoje; já passado -> semana que vem', async () => {
    const med = makeMedication({
      schedules: [
        makeSchedule({ id: 'ahead', time: '12:30' }), // hoje às 12:30
        makeSchedule({ id: 'behind', time: '08:00' }), // já passou (são 10:00)
      ],
    });

    await syncMedicationAlarms('baby-1', [med]);

    const ahead = new Date(triggerAt(0).timestamp);
    expect(ahead.getDay()).toBe(3); // qua
    expect(ahead.getDate()).toBe(5);
    expect(ahead.getHours()).toBe(12);
    expect(ahead.getMinutes()).toBe(30);

    const behind = new Date(triggerAt(1).timestamp);
    expect(behind.getDay()).toBe(3);
    expect(behind.getDate()).toBe(12); // +7 dias — nunca dispara "atrasado"
    expect(behind.getHours()).toBe(8);
  });

  it('trigger é timestamp com repetição SEMANAL e AlarmManager quando há permissão de exato', async () => {
    await syncMedicationAlarms('baby-1', [makeMedication()]);

    const trigger = triggerAt(0);
    expect(trigger.type).toBe(TriggerType.TIMESTAMP);
    expect(trigger.repeatFrequency).toBe(RepeatFrequency.WEEKLY);
    expect(trigger.alarmManager).toEqual({ allowWhileIdle: true });
  });

  it('sem permissão de exato: agenda inexato (sem AlarmManager) e sinaliza needsExactPermission', async () => {
    canExact.mockResolvedValue(false);

    const result = await syncMedicationAlarms('baby-1', [makeMedication()]);

    expect(result.scheduledCount).toBe(1);
    expect(result.needsExactPermission).toBe(true);
    expect(triggerAt(0).alarmManager).toBeUndefined();
  });

  it('sem alarme agendado, needsExactPermission fica false mesmo sem permissão', async () => {
    canExact.mockResolvedValue(false);

    const result = await syncMedicationAlarms('baby-1', []);

    expect(result).toEqual({ scheduledCount: 0, needsExactPermission: false });
  });

  it('ignora medicamento inativo, schedule inativo e schedule sem useAlarm', async () => {
    const meds = [
      makeMedication({ id: 'm1', isActive: false }),
      makeMedication({ id: 'm2', schedules: [makeSchedule({ isActive: false })] }),
      makeMedication({ id: 'm3', schedules: [makeSchedule({ useAlarm: false })] }),
    ];

    const result = await syncMedicationAlarms('baby-1', meds);

    expect(result.scheduledCount).toBe(0);
    expect(createTrigger).not.toHaveBeenCalled();
  });

  it('conteúdo localizado + dose decimal do backend normalizada ("20.000" -> "20")', async () => {
    const med = makeMedication({
      name: 'Amoxicilina',
      dose: '20.000',
      doseUnit: DoseUnit.ML,
    });

    await syncMedicationAlarms('baby-1', [med]);

    const notification = notificationAt(0);
    expect(notification.title).toBe('Hora do remédio 💊');
    expect(notification.body).toBe('Amoxicilina — 20 ml');
    expect(notification.data).toEqual({
      type: 'med-alarm',
      babyId: 'baby-1',
      medicationId: 'med-1',
      scheduleId: 'sch-1',
    });
  });

  it('reconcilia SÓ os alarmes do bebê alvo — outros bebês e features ficam intactos', async () => {
    getTriggerIds.mockResolvedValueOnce([
      'med-alarm:baby-1:old:mon',
      'med-alarm:baby-2:keep:mon',
      'feed-alarm:a1:06:00:mon',
    ]);

    await syncMedicationAlarms('baby-1', []);

    expect(cancelTrigger).toHaveBeenCalledTimes(1);
    expect(cancelTrigger).toHaveBeenCalledWith('med-alarm:baby-1:old:mon');
  });

  it('falha em um alarme não aborta o sync dos demais', async () => {
    // __DEV__ é true no jest — silencia o console.warn esperado.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    createTrigger.mockRejectedValueOnce(new Error('trigger no passado'));
    const med = makeMedication({
      schedules: [makeSchedule({ daysOfWeekMask: 62 })],
    });

    const result = await syncMedicationAlarms('baby-1', [med]);

    expect(createTrigger).toHaveBeenCalledTimes(5);
    expect(result.scheduledCount).toBe(4); // só o que agendou de verdade
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('cancelAllMedicationAlarms', () => {
  it('cancela os med-alarm: de TODOS os bebês, sem tocar em outras features', async () => {
    getTriggerIds.mockResolvedValueOnce([
      'med-alarm:baby-1:s1:mon',
      'med-alarm:baby-2:s2:tue',
      'feed-alarm:a1:06:00:mon',
      'trigger1',
    ]);

    await cancelAllMedicationAlarms();

    expect(cancelTrigger.mock.calls.map((c) => c[0])).toEqual([
      'med-alarm:baby-1:s1:mon',
      'med-alarm:baby-2:s2:tue',
    ]);
  });
});
