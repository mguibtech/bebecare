/**
 * Testes do agendamento dos despertadores pessoais (M7).
 *
 * Foco na lógica de expansão de horários (modo intervalo) e na reconciliação
 * por prefixo. O notifee vem mockado globalmente (jest.setup.js); a matemática
 * de "próxima ocorrência semanal" já é coberta em shared/alarms/recurrence.
 */
import notifee from '@notifee/react-native';

import { cancelAllAlarms, syncAlarms } from './notifee';
import {
  ALARM_CATEGORY_LABELS,
  AlarmCategory,
  maskFromDays,
  type Alarm,
} from './types';

const createTrigger = jest.mocked(notifee.createTriggerNotification);
const getTriggerIds = jest.mocked(notifee.getTriggerNotificationIds);
const cancelTrigger = jest.mocked(notifee.cancelTriggerNotification);

function makeAlarm(over: Partial<Alarm> = {}): Alarm {
  return {
    id: 'alarm-1',
    userId: 'user-1',
    label: 'Mamada da manhã',
    time: '06:00',
    daysOfWeekMask: maskFromDays(['mon']),
    category: AlarmCategory.FEEDING,
    intervalHours: null,
    soundKey: null,
    isActive: true,
    createdAt: '2026-08-01T00:00:00.000Z',
    updatedAt: '2026-08-01T00:00:00.000Z',
    ...over,
  };
}

/** Extrai o "HH:mm" do id `feed-alarm:<alarmId>:<HH:mm>:<day>`. */
function slotFromId(id: string | undefined): string {
  const parts = (id ?? '').split(':');
  return `${parts[2]}:${parts[3]}`;
}

function scheduledSlots(): string[] {
  return createTrigger.mock.calls.map((c) => slotFromId(c[0].id));
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('syncAlarms', () => {
  it('modo horário único: um trigger semanal por dia ativo, id determinístico', async () => {
    await syncAlarms([
      makeAlarm({ daysOfWeekMask: maskFromDays(['mon', 'thu']) }),
    ]);

    expect(createTrigger.mock.calls.map((c) => c[0].id)).toEqual([
      'feed-alarm:alarm-1:06:00:mon',
      'feed-alarm:alarm-1:06:00:thu',
    ]);
  });

  it('modo intervalo: expande horários cobrindo 24h a partir do início (com wrap da meia-noite)', async () => {
    await syncAlarms([makeAlarm({ intervalHours: 3 })]);

    expect(scheduledSlots()).toEqual([
      '06:00',
      '09:00',
      '12:00',
      '15:00',
      '18:00',
      '21:00',
      '00:00',
      '03:00',
    ]);
  });

  it('intervalo começando à noite dá a volta no relógio preservando os minutos', async () => {
    await syncAlarms([makeAlarm({ time: '22:30', intervalHours: 6 })]);

    expect(scheduledSlots()).toEqual(['22:30', '04:30', '10:30', '16:30']);
  });

  it('intervalo que não divide 24 trunca (floor) — sem slot parcial', async () => {
    // 5h não está nas INTERVAL_OPTIONS, mas a função precisa ser robusta:
    // floor(24/5) = 4 slots, o próximo (02:00 do dia seguinte) fica de fora.
    await syncAlarms([makeAlarm({ intervalHours: 5 })]);

    expect(scheduledSlots()).toEqual(['06:00', '11:00', '16:00', '21:00']);
  });

  it('modo intervalo × vários dias: agenda cada slot em cada dia ativo', async () => {
    await syncAlarms([
      makeAlarm({
        intervalHours: 6,
        daysOfWeekMask: maskFromDays(['sun', 'sat']),
      }),
    ]);

    // 4 slots × 2 dias
    expect(createTrigger).toHaveBeenCalledTimes(8);
    const days = createTrigger.mock.calls.map((c) =>
      String(c[0].id).split(':').pop(),
    );
    expect(new Set(days)).toEqual(new Set(['sun', 'sat']));
  });

  it('alarme inativo não agenda nada', async () => {
    await syncAlarms([makeAlarm({ isActive: false, intervalHours: 2 })]);

    expect(createTrigger).not.toHaveBeenCalled();
  });

  it('conteúdo: título com o label e corpo com a categoria', async () => {
    await syncAlarms([
      makeAlarm({ label: 'Troca', category: AlarmCategory.DIAPER }),
    ]);

    const call = createTrigger.mock.calls[0];
    expect(call?.[0].title).toBe('Troca ⏰');
    expect(call?.[0].body).toBe(ALARM_CATEGORY_LABELS[AlarmCategory.DIAPER]);
    expect(call?.[0].data).toEqual({ type: 'feed-alarm', alarmId: 'alarm-1' });
  });

  it('reconcilia: cancela só os feed-alarm: existentes antes de reagendar', async () => {
    getTriggerIds.mockResolvedValueOnce([
      'feed-alarm:old:06:00:mon',
      'med-alarm:baby-1:s1:mon', // alarme de remédio — de outra feature
      'trigger1',
    ]);

    await syncAlarms([]);

    expect(cancelTrigger).toHaveBeenCalledTimes(1);
    expect(cancelTrigger).toHaveBeenCalledWith('feed-alarm:old:06:00:mon');
  });
});

describe('cancelAllAlarms', () => {
  it('cancela todos os despertadores sem tocar em alarmes de remédio', async () => {
    getTriggerIds.mockResolvedValueOnce([
      'feed-alarm:a1:06:00:mon',
      'feed-alarm:a2:22:30:sat',
      'med-alarm:baby-1:s1:mon',
    ]);

    await cancelAllAlarms();

    expect(cancelTrigger.mock.calls.map((c) => c[0])).toEqual([
      'feed-alarm:a1:06:00:mon',
      'feed-alarm:a2:22:30:sat',
    ]);
  });
});
