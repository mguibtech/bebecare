/**
 * Testes dos helpers de i18n: detecção do idioma do sistema via Intl e
 * sanidade dos catálogos (pares de pluralização _one/_other).
 *
 * A paridade de CHAVES pt×en já é garantida em build (en: TranslationCatalog),
 * então aqui só cobrimos o que o compilador não pega.
 */
import i18n, { SUPPORTED_LANGUAGES, systemLanguage } from './index';
import { en } from './locales/en';
import { pt } from './locales/pt';

/** Mocka o locale resolvido pelo Intl.DateTimeFormat. */
function mockIntlLocale(locale: string): jest.SpyInstance {
  return jest.spyOn(Intl, 'DateTimeFormat').mockReturnValue({
    resolvedOptions: () => ({ locale }),
  } as unknown as Intl.DateTimeFormat);
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe('systemLanguage', () => {
  it('pt-BR -> pt', () => {
    mockIntlLocale('pt-BR');
    expect(systemLanguage()).toBe('pt');
  });

  it('en-US -> en', () => {
    mockIntlLocale('en-US');
    expect(systemLanguage()).toBe('en');
  });

  it('locale sem região (en) também resolve', () => {
    mockIntlLocale('en');
    expect(systemLanguage()).toBe('en');
  });

  it('idioma sem tradução (es-ES) cai no fallback pt', () => {
    mockIntlLocale('es-ES');
    expect(systemLanguage()).toBe('pt');
  });

  it('ambiente sem Intl utilizável cai no fallback pt', () => {
    jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(() => {
      throw new Error('Intl indisponível');
    });
    expect(systemLanguage()).toBe('pt');
  });
});

describe('inicialização', () => {
  it('todos os idiomas suportados têm bundle registrado', () => {
    for (const lang of SUPPORTED_LANGUAGES) {
      expect(i18n.hasResourceBundle(lang, 'translation')).toBe(true);
    }
  });
});

describe('pluralização (_one/_other)', () => {
  /** Achata o catálogo em chaves "a.b.c". */
  function flattenKeys(obj: Record<string, unknown>, prefix = ''): string[] {
    return Object.entries(obj).flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return typeof value === 'object' && value !== null
        ? flattenKeys(value as Record<string, unknown>, path)
        : [path];
    });
  }

  // Um sufixo órfão não é erro de build (a chave existe nos dois catálogos),
  // mas quebra o t() com count em runtime — por isso o guard aqui.
  it.each([
    ['pt', pt],
    ['en', en],
  ] as const)('%s: toda chave _one tem par _other (e vice-versa)', (_lang, catalog) => {
    const keys = new Set(flattenKeys(catalog));
    for (const key of keys) {
      if (key.endsWith('_one')) {
        expect(keys).toContain(key.replace(/_one$/, '_other'));
      }
      if (key.endsWith('_other')) {
        expect(keys).toContain(key.replace(/_other$/, '_one'));
      }
    }
  });

  it('t() resolve singular/plural com count nos dois idiomas', async () => {
    await i18n.changeLanguage('pt');
    expect(i18n.t('home.ageMonths', { count: 1 })).toBe('1 mês');
    expect(i18n.t('home.ageMonths', { count: 9 })).toBe('9 meses');

    await i18n.changeLanguage('en');
    expect(i18n.t('home.ageMonths', { count: 1 })).toBe('1 month');
    expect(i18n.t('home.ageMonths', { count: 9 })).toBe('9 months');

    await i18n.changeLanguage('pt'); // restaura pros outros testes
  });
});
