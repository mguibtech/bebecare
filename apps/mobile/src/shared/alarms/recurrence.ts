/**
 * Helpers de recorrencia semanal pra alarmes locais (notifee).
 *
 * Compartilhado entre os despertadores (M7) e — futuramente — o agendador de
 * medicamentos (M6, que hoje tem a propria copia). Logica pura, sem React.
 */

export type WeekdayKey =
  | 'sun'
  | 'mon'
  | 'tue'
  | 'wed'
  | 'thu'
  | 'fri'
  | 'sat';

/** WeekdayKey -> indice do Date.getDay() (dom=0 ... sab=6). */
export const WEEKDAY_INDEX: Record<WeekdayKey, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

/** "HH:mm" -> { hour, minute }. */
export function parseHhMm(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(':');
  return { hour: Number(h), minute: Number(m) };
}

/**
 * Proximo timestamp (ms) que cai no `weekday` no horario `hour:minute`. Se for
 * hoje mas o horario ja passou, pula pra semana seguinte — o primeiro disparo
 * nunca e imediato/atrasado.
 */
export function nextWeeklyOccurrenceMs(
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
