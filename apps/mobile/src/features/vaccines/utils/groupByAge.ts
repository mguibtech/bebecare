/**
 * Agrupa entries do schedule por marco etario (0m, 2m, 4m, 6m, 12m, etc).
 *
 * O backend ordena entries por status (overdue → due → upcoming → applied),
 * util pra "atalho" no topo da lista. Mas a UX padrao do calendário PNI
 * eh agrupar POR IDADE — pais leem como "vacinas dos 2 meses", "dos 6 meses".
 *
 * Esta funcao re-agrupa preservando metadado de status (cada grupo sabe
 * quantas estao em cada estado).
 */

import { VaccineStatus, type ScheduleEntry } from '../types';

export type AgeGroup = {
  /** Idade em meses (chave de agrupamento). 0 = ao nascer. */
  ageMonths: number;
  /** Label legivel em PT-BR ("Ao nascer", "2 meses", "1 ano"). */
  ageLabel: string;
  /** Entries dessa idade (ordenadas por displayOrder do PNI). */
  entries: ScheduleEntry[];
  /** Contagens pra mostrar em badges no header do grupo. */
  counts: Record<VaccineStatus, number>;
};

/** Converte idade em meses pra label PT-BR amigavel. */
export function ageLabelFor(months: number): string {
  if (months === 0) return 'Ao nascer';
  if (months < 12) return `${months} ${months === 1 ? 'mês' : 'meses'}`;
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} ${years === 1 ? 'ano' : 'anos'}`;
  }
  // Caso "15 meses", "18 meses" — mantem em meses ate completar ano.
  return `${months} meses`;
}

/**
 * Agrupa entries por recommendedAgeMonths. Dentro de cada grupo, ordena
 * por displayOrder do PNI.
 *
 * Os grupos são retornados em ordem crescente de idade.
 */
export function groupByAge(entries: ScheduleEntry[]): AgeGroup[] {
  const map = new Map<number, ScheduleEntry[]>();

  for (const entry of entries) {
    const age = entry.vaccine.recommendedAgeMonths;
    const existing = map.get(age);
    if (existing) {
      existing.push(entry);
    } else {
      map.set(age, [entry]);
    }
  }

  const sortedAges = Array.from(map.keys()).sort((a, b) => a - b);

  return sortedAges.map((ageMonths) => {
    const groupEntries = (map.get(ageMonths) ?? []).slice().sort(
      (a, b) => a.vaccine.displayOrder - b.vaccine.displayOrder,
    );

    const counts: Record<VaccineStatus, number> = {
      [VaccineStatus.APPLIED]: 0,
      [VaccineStatus.OVERDUE]: 0,
      [VaccineStatus.DUE]: 0,
      [VaccineStatus.UPCOMING]: 0,
    };
    for (const e of groupEntries) {
      counts[e.status]++;
    }

    return {
      ageMonths,
      ageLabel: ageLabelFor(ageMonths),
      entries: groupEntries,
      counts,
    };
  });
}
