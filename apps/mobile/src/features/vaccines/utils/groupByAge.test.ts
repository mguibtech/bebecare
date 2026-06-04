import { VaccineStatus, type ScheduleEntry, type Vaccine } from '../types';
import { ageLabelFor, groupByAge } from './groupByAge';

function makeVaccine(over: Partial<Vaccine> = {}): Vaccine {
  return {
    id: 'v1',
    code: 'CODE',
    name: 'Vacina',
    description: null,
    doseLabel: '1ª dose',
    doseNumber: 1,
    isBooster: false,
    recommendedAgeMonths: 0,
    minAgeMonths: 0,
    maxAgeMonths: null,
    displayOrder: 0,
    ...over,
  };
}

function makeEntry(
  ageMonths: number,
  displayOrder: number,
  status: VaccineStatus,
): ScheduleEntry {
  return {
    vaccine: makeVaccine({
      id: `v-${ageMonths}-${displayOrder}`,
      recommendedAgeMonths: ageMonths,
      displayOrder,
    }),
    status,
    appliedAt: null,
    recordId: null,
    expectedAt: '2026-01-01',
  };
}

describe('ageLabelFor', () => {
  it('0 meses = "Ao nascer"', () => {
    expect(ageLabelFor(0)).toBe('Ao nascer');
  });

  it('singular vs plural de mes', () => {
    expect(ageLabelFor(1)).toBe('1 mês');
    expect(ageLabelFor(2)).toBe('2 meses');
    expect(ageLabelFor(11)).toBe('11 meses');
  });

  it('multiplos de 12 viram anos (singular/plural)', () => {
    expect(ageLabelFor(12)).toBe('1 ano');
    expect(ageLabelFor(24)).toBe('2 anos');
  });

  it('idades nao-multiplas de 12 ficam em meses', () => {
    expect(ageLabelFor(15)).toBe('15 meses');
    expect(ageLabelFor(18)).toBe('18 meses');
  });
});

describe('groupByAge', () => {
  it('agrupa por idade e retorna grupos em ordem crescente', () => {
    const groups = groupByAge([
      makeEntry(6, 0, VaccineStatus.DUE),
      makeEntry(0, 0, VaccineStatus.APPLIED),
      makeEntry(2, 0, VaccineStatus.OVERDUE),
    ]);
    expect(groups.map((g) => g.ageMonths)).toEqual([0, 2, 6]);
    expect(groups[0]?.ageLabel).toBe('Ao nascer');
    expect(groups[1]?.ageLabel).toBe('2 meses');
  });

  it('dentro do grupo, ordena por displayOrder do PNI', () => {
    const groups = groupByAge([
      makeEntry(2, 3, VaccineStatus.DUE),
      makeEntry(2, 1, VaccineStatus.DUE),
      makeEntry(2, 2, VaccineStatus.DUE),
    ]);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.entries.map((e) => e.vaccine.displayOrder)).toEqual([
      1, 2, 3,
    ]);
  });

  it('conta status por grupo', () => {
    const groups = groupByAge([
      makeEntry(2, 0, VaccineStatus.OVERDUE),
      makeEntry(2, 1, VaccineStatus.OVERDUE),
      makeEntry(2, 2, VaccineStatus.APPLIED),
    ]);
    expect(groups[0]?.counts[VaccineStatus.OVERDUE]).toBe(2);
    expect(groups[0]?.counts[VaccineStatus.APPLIED]).toBe(1);
    expect(groups[0]?.counts[VaccineStatus.DUE]).toBe(0);
  });

  it('lista vazia -> nenhum grupo', () => {
    expect(groupByAge([])).toEqual([]);
  });
});
