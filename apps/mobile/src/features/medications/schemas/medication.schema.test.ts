/**
 * Testes do schema do form de medicamento (dose 0.001-99999.999,
 * datas YYYY-MM-DD, fim >= início).
 */
import type { z } from 'zod';

import i18n from '@/shared/i18n';

import { DoseUnit } from '../types';
import { makeMedicationSchema } from './medication.schema';

let schema: ReturnType<typeof makeMedicationSchema>;

beforeAll(async () => {
  await i18n.changeLanguage('pt');
  schema = makeMedicationSchema(i18n.t);
});

/** Mensagem do primeiro issue de um campo específico (undefined se passou). */
function fieldMessage<I, O>(
  result: z.SafeParseReturnType<I, O>,
  field: string,
): string | undefined {
  return result.success
    ? undefined
    : result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

const validBase = {
  name: 'Vitamina D',
  dose: '2',
  doseUnit: DoseUnit.DROP,
  startDate: '2026-08-01',
};

describe('makeMedicationSchema — dose', () => {
  it('string do form vira number (incluindo decimais)', () => {
    const parsed = schema.parse({ ...validBase, dose: '2.5' });
    expect(parsed.dose).toBe(2.5);
  });

  it('vazia cai no required (preprocess transforma "" em undefined)', () => {
    const r = schema.safeParse({ ...validBase, dose: '' });
    expect(fieldMessage(r, 'dose')).toBe(i18n.t('validation.doseRequired'));
  });

  it('limites 0.001 e 99999.999 são aceitos', () => {
    expect(schema.safeParse({ ...validBase, dose: '0.001' }).success).toBe(
      true,
    );
    expect(schema.safeParse({ ...validBase, dose: '99999.999' }).success).toBe(
      true,
    );
  });

  it('zero e acima do teto são rejeitados', () => {
    expect(
      fieldMessage(schema.safeParse({ ...validBase, dose: '0' }), 'dose'),
    ).toBe(i18n.t('validation.doseMin'));
    expect(
      fieldMessage(schema.safeParse({ ...validBase, dose: '100000' }), 'dose'),
    ).toBe(i18n.t('validation.doseMax'));
  });

  it('texto não-numérico é rejeitado', () => {
    const r = schema.safeParse({ ...validBase, dose: 'duas gotas' });
    expect(fieldMessage(r, 'dose')).toBe(i18n.t('validation.doseInvalid'));
  });

  it('aceita vírgula decimal pt-BR ("2,5")', () => {
    expect(schema.parse({ ...validBase, dose: '2,5' }).dose).toBe(2.5);
  });
});

describe('makeMedicationSchema — unidade', () => {
  it('valor fora do enum cai na mensagem do errorMap', () => {
    const r = schema.safeParse({ ...validBase, doseUnit: 'litros' });
    expect(fieldMessage(r, 'doseUnit')).toBe(i18n.t('validation.unitRequired'));
  });
});

describe('makeMedicationSchema — datas', () => {
  it('startDate fora de YYYY-MM-DD é rejeitada', () => {
    const r = schema.safeParse({ ...validBase, startDate: '01/08/2026' });
    expect(fieldMessage(r, 'startDate')).toBe(i18n.t('validation.dateFormat'));
  });

  it('endDate vazia vira undefined (uso contínuo)', () => {
    const parsed = schema.parse({ ...validBase, endDate: '' });
    expect(parsed.endDate).toBeUndefined();
  });

  it('endDate igual à startDate é aceita (dose única no dia)', () => {
    expect(
      schema.safeParse({ ...validBase, endDate: validBase.startDate }).success,
    ).toBe(true);
  });

  it('endDate antes da startDate é rejeitada, com o erro NO CAMPO endDate', () => {
    const r = schema.safeParse({ ...validBase, endDate: '2026-07-31' });
    expect(fieldMessage(r, 'endDate')).toBe(i18n.t('validation.endAfterStart'));
  });
});

describe('makeMedicationSchema — defaults', () => {
  it('isActive default true quando omitido', () => {
    expect(schema.parse(validBase).isActive).toBe(true);
  });
});
