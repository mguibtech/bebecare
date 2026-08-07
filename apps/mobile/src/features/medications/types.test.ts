import i18n from '@/shared/i18n';

import {
  ALL_DAYS_MASK,
  DAY_BITMASKS,
  DAY_KEYS,
  DOSE_UNIT_KEYS,
  WEEKDAYS_MASK,
  WEEKEND_MASK,
  daysFromMask,
  maskFromDays,
  type DayKey,
} from './types';

const ALL_DAYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

describe('DAY_BITMASKS', () => {
  it('segue o contrato do backend: dom=1 ... sab=64 (potências de 2)', () => {
    expect(DAY_BITMASKS).toEqual({
      sun: 1,
      mon: 2,
      tue: 4,
      wed: 8,
      thu: 16,
      fri: 32,
      sat: 64,
    });
  });

  it('máscaras compostas batem com a combinação dos dias', () => {
    expect(ALL_DAYS_MASK).toBe(maskFromDays(ALL_DAYS));
    expect(WEEKDAYS_MASK).toBe(
      maskFromDays(['mon', 'tue', 'wed', 'thu', 'fri']),
    );
    expect(WEEKEND_MASK).toBe(maskFromDays(['sun', 'sat']));
  });
});

describe('daysFromMask', () => {
  it('0 -> nenhum dia', () => {
    expect(daysFromMask(0)).toEqual([]);
  });

  it('bit único -> um dia', () => {
    expect(daysFromMask(1)).toEqual(['sun']);
    expect(daysFromMask(8)).toEqual(['wed']);
    expect(daysFromMask(64)).toEqual(['sat']);
  });

  it('127 -> semana completa em ordem dom..sab', () => {
    expect(daysFromMask(ALL_DAYS_MASK)).toEqual(ALL_DAYS);
  });

  it('62 -> dias úteis (seg a sex)', () => {
    expect(daysFromMask(WEEKDAYS_MASK)).toEqual([
      'mon',
      'tue',
      'wed',
      'thu',
      'fri',
    ]);
  });

  it('65 -> fim de semana (dom + sab)', () => {
    expect(daysFromMask(WEEKEND_MASK)).toEqual(['sun', 'sat']);
  });

  it('bits acima do 7º são ignorados', () => {
    expect(daysFromMask(128)).toEqual([]);
    expect(daysFromMask(128 + 2)).toEqual(['mon']);
  });
});

describe('maskFromDays', () => {
  it('array vazio -> 0', () => {
    expect(maskFromDays([])).toBe(0);
  });

  it('dias duplicados não somam duas vezes (OR, não soma)', () => {
    expect(maskFromDays(['mon', 'mon', 'mon'])).toBe(DAY_BITMASKS.mon);
  });

  it('ordem do array não altera a máscara', () => {
    expect(maskFromDays(['fri', 'sun'])).toBe(maskFromDays(['sun', 'fri']));
  });

  it('roundtrip exaustivo: maskFromDays(daysFromMask(m)) === m pra 0..127', () => {
    for (let mask = 0; mask <= ALL_DAYS_MASK; mask += 1) {
      expect(maskFromDays(daysFromMask(mask))).toBe(mask);
    }
  });
});

describe('chaves i18n do domínio (DOSE_UNIT_KEYS / DAY_KEYS)', () => {
  // Garante que nenhuma chave aponta pro vazio em NENHUM dos catálogos —
  // um typo aqui viraria "meds.unitMl" cru na notificação do alarme.
  const allKeys = [
    ...Object.values(DOSE_UNIT_KEYS),
    ...Object.values(DAY_KEYS),
  ];

  it.each(allKeys)('"%s" resolve nos catálogos pt e en', (key) => {
    expect(i18n.getResource('pt', 'translation', key)).toEqual(
      expect.any(String),
    );
    expect(i18n.getResource('en', 'translation', key)).toEqual(
      expect.any(String),
    );
  });
});
