// Helpers de cálculo de idade. Implementação mínima — se complicar (ex.: timezone,
// curvas OMS por dia), substituir por date-fns sem alterar a API destes helpers.

// Parse de 'YYYY-MM-DD' como data local (00:00 do dia).
export function parseISO(iso: string): Date {
  // Construímos com UTC para evitar shift de timezone em diff de dias.
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

// Diferença em dias inteiros (ignora horário) entre duas datas.
export function differenceInCalendarDays(later: Date, earlier: Date): number {
  const MS_IN_DAY = 86_400_000;
  const a = Date.UTC(later.getUTCFullYear(), later.getUTCMonth(), later.getUTCDate());
  const b = Date.UTC(earlier.getUTCFullYear(), earlier.getUTCMonth(), earlier.getUTCDate());
  return Math.floor((a - b) / MS_IN_DAY);
}

// Diferença em meses completos (ex.: 9 meses e 5 dias = 9).
export function differenceInMonths(later: Date, earlier: Date): number {
  let months =
    (later.getUTCFullYear() - earlier.getUTCFullYear()) * 12 +
    (later.getUTCMonth() - earlier.getUTCMonth());
  // Se ainda não completou o dia do mês no mês atual, subtrai 1
  if (later.getUTCDate() < earlier.getUTCDate()) months -= 1;
  return Math.max(0, months);
}
