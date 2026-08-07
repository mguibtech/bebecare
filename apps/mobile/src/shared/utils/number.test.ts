/**
 * Testes do `parseNumericInput` — o preprocess usado pelos campos numéricos
 * dos forms (dose, peso e altura ao nascer).
 *
 * Em RN todo TextInput entrega string, e o teclado numérico pt-BR usa VÍRGULA
 * como separador decimal. Entrada inválida é devolvida INTACTA de propósito,
 * pra que o zod emita `invalid_type_error` em vez de um NaN silencioso.
 */
import { parseNumericInput } from './number';

describe('parseNumericInput — vazios', () => {
  it('string vazia vira undefined (campo opcional não preenchido)', () => {
    expect(parseNumericInput('')).toBeUndefined();
  });

  it('string só com espaços vira undefined', () => {
    expect(parseNumericInput('   ')).toBeUndefined();
  });

  it('null e undefined viram undefined', () => {
    expect(parseNumericInput(null)).toBeUndefined();
    expect(parseNumericInput(undefined)).toBeUndefined();
  });
});

describe('parseNumericInput — conversão', () => {
  it('vírgula decimal pt-BR ("2,5") vira 2.5', () => {
    expect(parseNumericInput('2,5')).toBe(2.5);
  });

  it('ponto decimal ("2.5") continua funcionando', () => {
    expect(parseNumericInput('2.5')).toBe(2.5);
  });

  it('inteiro em string vira number', () => {
    expect(parseNumericInput('3200')).toBe(3200);
  });

  it('espaços nas pontas são aparados antes da conversão', () => {
    expect(parseNumericInput('  52,5  ')).toBe(52.5);
  });

  it('negativo com vírgula também converte (o range fica pro zod)', () => {
    expect(parseNumericInput('-1,5')).toBe(-1.5);
  });
});

describe('parseNumericInput — zero não é tratado como vazio', () => {
  it('"0" vira 0, não undefined', () => {
    expect(parseNumericInput('0')).toBe(0);
  });

  it('0 numérico é devolvido como 0', () => {
    expect(parseNumericInput(0)).toBe(0);
  });
});

describe('parseNumericInput — valor já numérico', () => {
  it('number é devolvido inalterado', () => {
    expect(parseNumericInput(52.5)).toBe(52.5);
    expect(parseNumericInput(3200)).toBe(3200);
  });
});

describe('parseNumericInput — entrada inválida volta intacta', () => {
  it('texto não numérico é devolvido como veio', () => {
    expect(parseNumericInput('abc')).toBe('abc');
    expect(parseNumericInput('duas gotas')).toBe('duas gotas');
  });

  it('formatação de milhar ("1.234,5") é inválida de propósito — ambígua', () => {
    // Só a PRIMEIRA vírgula vira ponto: "1.234,5" → "1.234.5" → NaN.
    expect(parseNumericInput('1.234,5')).toBe('1.234,5');
  });

  it('mais de uma vírgula ("1,2,3") é inválida', () => {
    expect(parseNumericInput('1,2,3')).toBe('1,2,3');
  });

  it('objeto não numérico volta intacto', () => {
    const value = { dose: 2 };
    expect(parseNumericInput(value)).toBe(value);
  });
});
