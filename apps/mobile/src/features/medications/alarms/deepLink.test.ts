/**
 * Testes do roteamento do toque na notificação de alarme de remédio.
 *
 * navigationRef é mockado localmente: whenNavigationReady executa o callback
 * na hora (container "pronto"), e navigate é um jest.fn inspecionável.
 */
import { navigationRef } from '@/app/navigation/navigationRef';

import { routeFromAlarmNotification } from './deepLink';

jest.mock('@/app/navigation/navigationRef', () => ({
  navigationRef: { navigate: jest.fn() },
  whenNavigationReady: (fn: () => void) => fn(),
}));

const navigate = navigationRef.navigate as unknown as jest.Mock;

beforeEach(() => {
  navigate.mockClear();
});

describe('routeFromAlarmNotification', () => {
  it('payload de alarme de remédio -> navega pra aba "Hoje"', () => {
    routeFromAlarmNotification({
      type: 'med-alarm',
      babyId: 'baby-1',
      medicationId: 'med-1',
      scheduleId: 'sch-1',
    });

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('MainTabs', { screen: 'Today' });
  });

  it('sem data -> não navega', () => {
    routeFromAlarmNotification(undefined);

    expect(navigate).not.toHaveBeenCalled();
  });

  it('type de outra feature (ex.: feed-alarm) -> não navega', () => {
    routeFromAlarmNotification({ type: 'feed-alarm', alarmId: 'a1' });

    expect(navigate).not.toHaveBeenCalled();
  });

  it('data sem type -> não navega', () => {
    routeFromAlarmNotification({ babyId: 'baby-1' });

    expect(navigate).not.toHaveBeenCalled();
  });
});
