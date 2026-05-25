// Helpers de bitmask para dias da semana usados em MedSchedule.
//
// Convenção:
//   bit 0 (1)   = domingo
//   bit 1 (2)   = segunda
//   bit 2 (4)   = terça
//   bit 3 (8)   = quarta
//   bit 4 (16)  = quinta
//   bit 5 (32)  = sexta
//   bit 6 (64)  = sábado
//
// Todos os dias = 127 (0b1111111)
// Só dias úteis (seg-sex) = 2+4+8+16+32 = 62
// Só fins de semana (dom+sáb) = 1+64 = 65

export const DAYS_OF_WEEK_ALL = 127;

export const DayBit = {
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 4,
  WEDNESDAY: 8,
  THURSDAY: 16,
  FRIDAY: 32,
  SATURDAY: 64,
} as const;

// Converte um Date pro bit correspondente. Usa getUTCDay() (0=domingo).
export function dayBitForDate(date: Date): number {
  return 1 << date.getUTCDay();
}

// True se o dia da semana da `date` está incluído no mask.
export function isDayInMask(mask: number, date: Date): boolean {
  return (mask & dayBitForDate(date)) !== 0;
}

// Valida que o mask é um int entre 1 e 127.
export function isValidDaysOfWeekMask(mask: number): boolean {
  return Number.isInteger(mask) && mask >= 1 && mask <= 127;
}

// Lista os dias do mask como nomes curtos em pt-BR (pra logs/debug).
export function maskToDayNames(mask: number): string[] {
  const names = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
  return names.filter((_, i) => (mask & (1 << i)) !== 0);
}
