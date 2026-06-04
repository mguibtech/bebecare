import {
  WEEKDAY_INDEX,
  parseHhMm,
  nextWeeklyOccurrenceMs,
} from './recurrence';

describe('parseHhMm', () => {
  it('converte "HH:mm" em { hour, minute }', () => {
    expect(parseHhMm('06:30')).toEqual({ hour: 6, minute: 30 });
    expect(parseHhMm('00:00')).toEqual({ hour: 0, minute: 0 });
    expect(parseHhMm('23:05')).toEqual({ hour: 23, minute: 5 });
  });
});

describe('WEEKDAY_INDEX', () => {
  it('mapeia domingo=0 ... sabado=6 (igual Date.getDay)', () => {
    expect(WEEKDAY_INDEX.sun).toBe(0);
    expect(WEEKDAY_INDEX.sat).toBe(6);
    expect(WEEKDAY_INDEX.wed).toBe(3);
  });
});

describe('nextWeeklyOccurrenceMs', () => {
  // Ancora deterministica: 04/06/2026 10:00 local. Derivamos tudo do getDay()
  // dessa data pra o teste nao depender de qual dia da semana ela cai.
  const from = new Date(2026, 5, 4, 10, 0, 0, 0);
  const today = from.getDay();

  it('cai sempre no weekday pedido, no horario pedido', () => {
    const r = new Date(nextWeeklyOccurrenceMs((today + 2) % 7, 7, 15, from));
    expect(r.getDay()).toBe((today + 2) % 7);
    expect(r.getHours()).toBe(7);
    expect(r.getMinutes()).toBe(15);
  });

  it('hoje com horario ainda no futuro -> mesmo dia', () => {
    const r = new Date(nextWeeklyOccurrenceMs(today, 12, 0, from));
    expect(r.getDate()).toBe(from.getDate());
    expect(r.getHours()).toBe(12);
  });

  it('hoje com horario ja passado -> proxima semana (+7 dias)', () => {
    const r = new Date(nextWeeklyOccurrenceMs(today, 8, 0, from));
    expect(r.getDate()).toBe(from.getDate() + 7);
    expect(r.getDay()).toBe(today);
  });

  it('hoje no horario exato -> nunca dispara imediato, vai pra semana seguinte', () => {
    const r = nextWeeklyOccurrenceMs(today, 10, 0, from);
    expect(r).toBeGreaterThan(from.getTime());
    expect(new Date(r).getDate()).toBe(from.getDate() + 7);
  });

  it('amanha -> +1 dia', () => {
    const r = new Date(nextWeeklyOccurrenceMs((today + 1) % 7, 9, 0, from));
    expect(r.getDate()).toBe(from.getDate() + 1);
  });

  it('ontem -> daqui a 6 dias (proxima ocorrencia futura)', () => {
    const r = new Date(nextWeeklyOccurrenceMs((today + 6) % 7, 9, 0, from));
    expect(r.getDate()).toBe(from.getDate() + 6);
  });
});
