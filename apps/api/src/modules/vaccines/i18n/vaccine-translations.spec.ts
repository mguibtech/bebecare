import { resolveLang } from '../../../common/i18n/lang';
import { translateVaccine } from './vaccine-translations';
import { Vaccine } from '../entities/vaccine.entity';

function buildVaccine(overrides: Partial<Vaccine> = {}): Vaccine {
  return {
    id: 'v-1',
    code: 'BCG',
    name: 'BCG',
    description: 'Previne formas graves de tuberculose. Aplicada na maternidade.',
    doseLabel: 'Dose única',
    doseNumber: 1,
    isBooster: false,
    recommendedAgeMonths: 0,
    minAgeMonths: 0,
    maxAgeMonths: 60,
    displayOrder: 10,
    isActive: true,
    ...overrides,
  } as Vaccine;
}

describe('resolveLang', () => {
  it('retorna pt sem header', () => {
    expect(resolveLang(undefined)).toBe('pt');
    expect(resolveLang('')).toBe('pt');
  });

  it('pega a primeira tag e ignora a região', () => {
    expect(resolveLang('en-US,en;q=0.9,pt;q=0.8')).toBe('en');
    expect(resolveLang('pt-BR')).toBe('pt');
  });

  it('cai no pt pra idioma não suportado', () => {
    expect(resolveLang('fr-FR,fr;q=0.9')).toBe('pt');
  });
});

describe('translateVaccine', () => {
  it('devolve os valores pt do registro quando lang=pt', () => {
    const v = buildVaccine();
    expect(translateVaccine(v, 'pt')).toEqual({
      name: 'BCG',
      description: v.description,
      doseLabel: 'Dose única',
    });
  });

  it('aplica o override en quando o code existe', () => {
    const v = buildVaccine();
    const t = translateVaccine(v, 'en');
    expect(t.name).toBe('BCG');
    expect(t.doseLabel).toBe('Single dose');
    expect(t.description).toMatch(/tuberculosis/);
  });

  it('faz fallback pro pt quando o code não tem tradução en', () => {
    const v = buildVaccine({ code: 'CODE_INEXISTENTE', doseLabel: 'Reforço' });
    expect(translateVaccine(v, 'en')).toEqual({
      name: v.name,
      description: v.description,
      doseLabel: 'Reforço',
    });
  });
});
