/**
 * Testes da soneca de dose (disparo único em agora + N minutos).
 * O notifee vem mockado globalmente (jest.setup.js).
 */
import notifee, { TriggerType, type TimestampTrigger } from '@notifee/react-native';

import i18n from '@/shared/i18n';

import { DoseStatus, DoseUnit, type MedDoseLog } from '../types';
import { DEFAULT_SNOOZE_MINUTES, snoozeDose } from './snooze';

const createTrigger = jest.mocked(notifee.createTriggerNotification);

// Âncora determinística: 05/08/2026 14:00 local.
const NOW = new Date(2026, 7, 5, 14, 0, 0);

function makeDose(over: Partial<MedDoseLog> = {}): MedDoseLog {
  return {
    id: 'dose-1',
    babyId: 'baby-1',
    familyId: 'fam-1',
    scheduleId: 'sch-1',
    medication: {
      id: 'med-1',
      name: 'Amoxicilina',
      dose: '20.000',
      doseUnit: DoseUnit.ML,
      instructions: null,
    },
    scheduledFor: '2026-08-05T13:00:00.000Z',
    status: DoseStatus.PENDING,
    takenAt: null,
    skipReason: null,
    loggedByUserId: null,
    loggedByName: null,
    ...over,
  };
}

/** Argumentos da i-ésima chamada do createTriggerNotification. */
function callAt(index: number) {
  const call = createTrigger.mock.calls[index];
  if (!call) {
    throw new Error(`createTriggerNotification não foi chamado ${index + 1}x`);
  }
  return { notification: call[0], trigger: call[1] as TimestampTrigger };
}

beforeAll(async () => {
  await i18n.changeLanguage('pt');
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers({ now: NOW });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('snoozeDose', () => {
  it('agenda disparo ÚNICO (sem repetição) em agora + 10min por padrão', async () => {
    await snoozeDose(makeDose());

    const { trigger } = callAt(0);
    expect(trigger.type).toBe(TriggerType.TIMESTAMP);
    expect(trigger.timestamp).toBe(
      NOW.getTime() + DEFAULT_SNOOZE_MINUTES * 60_000,
    );
    // Soneca não repete — diferente do alarme semanal do scheduler.
    expect(trigger.repeatFrequency).toBeUndefined();
    // Sempre exato: fura o Doze pra tocar na hora.
    expect(trigger.alarmManager).toEqual({ allowWhileIdle: true });
  });

  it('aceita intervalo customizado em minutos', async () => {
    await snoozeDose(makeDose(), 5);

    expect(callAt(0).trigger.timestamp).toBe(NOW.getTime() + 5 * 60_000);
  });

  it('id determinístico por dose: re-sonecar substitui o agendamento anterior', async () => {
    await snoozeDose(makeDose());
    await snoozeDose(makeDose());

    expect(createTrigger.mock.calls.map((c) => c[0].id)).toEqual([
      'med-alarm:snooze:dose-1',
      'med-alarm:snooze:dose-1',
    ]);
  });

  it('conteúdo: título de soneca, dose normalizada e payload igual ao do alarme (deep-link)', async () => {
    await snoozeDose(makeDose());

    const { notification } = callAt(0);
    expect(notification.title).toBe('Hora do remédio 💊 (soneca)');
    expect(notification.body).toBe('Amoxicilina — 20 ml');
    // Mesmo payload do alarme normal -> o toque abre a aba "Hoje".
    expect(notification.data).toEqual({
      type: 'med-alarm',
      babyId: 'baby-1',
      medicationId: 'med-1',
      scheduleId: 'sch-1',
    });
  });
});
