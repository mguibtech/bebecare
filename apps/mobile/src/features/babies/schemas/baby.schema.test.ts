/**
 * Testes do schema do form de bebê (limites alinhados com o backend:
 * peso 300-8000g inteiro, altura 20-70cm, data de nascimento não-futura).
 *
 * Mensagens vêm do catálogo i18n — fixamos pt no beforeAll pra determinismo
 * (o jest roda com locale do sistema, que pode ser en).
 */
import type { z } from 'zod';

import i18n from '@/shared/i18n';

import { Sex } from '../types';
import { makeBabySchema } from './baby.schema';

let schema: ReturnType<typeof makeBabySchema>;

beforeAll(async () => {
  await i18n.changeLanguage('pt');
  // O schema "assa" as mensagens na criação — montar DEPOIS do changeLanguage.
  schema = makeBabySchema(i18n.t);
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

/** Data local (YYYY-MM-DD) deslocada de hoje em `offsetDays`. */
function localIsoDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

const validBase = {
  name: 'Alice',
  sex: Sex.FEMALE,
  birthDate: '2025-11-01',
};

describe('makeBabySchema — cadastro mínimo', () => {
  it('aceita só nome + sexo + data de nascimento', () => {
    expect(schema.safeParse(validBase).success).toBe(true);
  });

  it('strings vazias dos opcionais viram undefined (form manda "" e a API não deve receber)', () => {
    const parsed = schema.parse({
      ...validBase,
      allergies: '',
      eyeColor: '',
      notes: '',
      avatarSeed: '',
      birthWeightGrams: '',
      birthHeightCm: '',
    });

    expect(parsed.allergies).toBeUndefined();
    expect(parsed.eyeColor).toBeUndefined();
    expect(parsed.notes).toBeUndefined();
    expect(parsed.avatarSeed).toBeUndefined();
    expect(parsed.birthWeightGrams).toBeUndefined();
    expect(parsed.birthHeightCm).toBeUndefined();
  });
});

describe('makeBabySchema — nome', () => {
  it('aplica trim', () => {
    expect(schema.parse({ ...validBase, name: '  Alice  ' }).name).toBe(
      'Alice',
    );
  });

  it('só espaços conta como vazio', () => {
    const r = schema.safeParse({ ...validBase, name: '   ' });
    expect(fieldMessage(r, 'name')).toBe(i18n.t('validation.nameRequired'));
  });

  it('120 chars ok, 121 estoura', () => {
    expect(
      schema.safeParse({ ...validBase, name: 'a'.repeat(120) }).success,
    ).toBe(true);
    const r = schema.safeParse({ ...validBase, name: 'a'.repeat(121) });
    expect(fieldMessage(r, 'name')).toBe(i18n.t('validation.nameTooLong'));
  });
});

describe('makeBabySchema — sexo', () => {
  it('valor fora do enum cai na mensagem do errorMap', () => {
    const r = schema.safeParse({ ...validBase, sex: 'other' });
    expect(fieldMessage(r, 'sex')).toBe(i18n.t('validation.sexRequired'));
  });
});

describe('makeBabySchema — data de nascimento', () => {
  it('formato fora de YYYY-MM-DD é rejeitado', () => {
    const r = schema.safeParse({ ...validBase, birthDate: '01/11/2025' });
    expect(fieldMessage(r, 'birthDate')).toBe(i18n.t('validation.dateFormat'));
  });

  it('hoje é aceito (limite)', () => {
    expect(
      schema.safeParse({ ...validBase, birthDate: localIsoDate(0) }).success,
    ).toBe(true);
  });

  it('amanhã é rejeitado (bebê do futuro)', () => {
    const r = schema.safeParse({ ...validBase, birthDate: localIsoDate(1) });
    expect(fieldMessage(r, 'birthDate')).toBe(
      i18n.t('validation.birthDateFuture'),
    );
  });

  it('data de calendário impossível (2026-13-40) informa que é inválida', () => {
    const r = schema.safeParse({ ...validBase, birthDate: '2026-13-40' });
    expect(fieldMessage(r, 'birthDate')).toBe(
      i18n.t('validation.birthDateInvalid'),
    );
  });
});

describe('makeBabySchema — peso ao nascer (300-8000g, inteiro)', () => {
  it('string numérica do form vira number', () => {
    expect(
      schema.parse({ ...validBase, birthWeightGrams: '3200' })
        .birthWeightGrams,
    ).toBe(3200);
  });

  it('limites 300 e 8000 são aceitos', () => {
    expect(
      schema.safeParse({ ...validBase, birthWeightGrams: 300 }).success,
    ).toBe(true);
    expect(
      schema.safeParse({ ...validBase, birthWeightGrams: 8000 }).success,
    ).toBe(true);
  });

  it('299 e 8001 são rejeitados com as mensagens de limite', () => {
    expect(
      fieldMessage(
        schema.safeParse({ ...validBase, birthWeightGrams: 299 }),
        'birthWeightGrams',
      ),
    ).toBe(i18n.t('validation.weightMin'));
    expect(
      fieldMessage(
        schema.safeParse({ ...validBase, birthWeightGrams: 8001 }),
        'birthWeightGrams',
      ),
    ).toBe(i18n.t('validation.weightMax'));
  });

  it('decimal é rejeitado (peso em gramas inteiras)', () => {
    const r = schema.safeParse({ ...validBase, birthWeightGrams: 3200.5 });
    expect(fieldMessage(r, 'birthWeightGrams')).toBe(
      i18n.t('validation.weightInteger'),
    );
  });

  it('texto não-numérico é rejeitado', () => {
    const r = schema.safeParse({ ...validBase, birthWeightGrams: 'abc' });
    expect(fieldMessage(r, 'birthWeightGrams')).toBe(
      i18n.t('validation.weightInvalid'),
    );
  });
});

describe('makeBabySchema — altura ao nascer (20-70cm)', () => {
  it('aceita decimais e converte string do form', () => {
    expect(
      schema.parse({ ...validBase, birthHeightCm: '52.5' }).birthHeightCm,
    ).toBe(52.5);
  });

  it('limites 20 e 70 são aceitos', () => {
    expect(schema.safeParse({ ...validBase, birthHeightCm: 20 }).success).toBe(
      true,
    );
    expect(schema.safeParse({ ...validBase, birthHeightCm: 70 }).success).toBe(
      true,
    );
  });

  it('19.9 e 70.1 são rejeitados com as mensagens de limite', () => {
    expect(
      fieldMessage(
        schema.safeParse({ ...validBase, birthHeightCm: 19.9 }),
        'birthHeightCm',
      ),
    ).toBe(i18n.t('validation.heightMin'));
    expect(
      fieldMessage(
        schema.safeParse({ ...validBase, birthHeightCm: 70.1 }),
        'birthHeightCm',
      ),
    ).toBe(i18n.t('validation.heightMax'));
  });

  it('aceita vírgula decimal pt-BR ("52,5")', () => {
    expect(
      schema.parse({ ...validBase, birthHeightCm: '52,5' }).birthHeightCm,
    ).toBe(52.5);
  });
});

describe('makeBabySchema — campos longos', () => {
  it('alergias até 500; 501 estoura', () => {
    expect(
      schema.safeParse({ ...validBase, allergies: 'a'.repeat(500) }).success,
    ).toBe(true);
    const r = schema.safeParse({ ...validBase, allergies: 'a'.repeat(501) });
    expect(fieldMessage(r, 'allergies')).toBe(i18n.t('validation.max500'));
  });

  it('cor dos olhos até 30; 31 estoura', () => {
    const r = schema.safeParse({ ...validBase, eyeColor: 'a'.repeat(31) });
    expect(fieldMessage(r, 'eyeColor')).toBe(i18n.t('validation.max30'));
  });
});
