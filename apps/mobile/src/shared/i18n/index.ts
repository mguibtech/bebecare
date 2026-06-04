/**
 * i18n do app — segue o idioma do sistema.
 *
 * Deteccao do locale SEM dependencia nativa: usa `Intl` (o Hermes do RN 0.85
 * vem com Intl). Pega o idioma do device (ex.: "pt-BR" -> "pt") e cai no
 * fallback 'pt' quando o idioma nao tem traducao.
 *
 * Importar este modulo 1x no boot (App.tsx) ja inicializa o i18next.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { pt } from './locales/pt';
import { en } from './locales/en';

export const SUPPORTED_LANGUAGES = ['pt', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const FALLBACK: SupportedLanguage = 'pt';

/** Idioma do sistema (base, sem regiao). Robusto a ambientes sem Intl. */
export function systemLanguage(): SupportedLanguage {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale; // "pt-BR"
    const base = (locale.split('-')[0] ?? '').toLowerCase();
    return (SUPPORTED_LANGUAGES as readonly string[]).includes(base)
      ? (base as SupportedLanguage)
      : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

void i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
  },
  lng: systemLanguage(),
  fallbackLng: FALLBACK,
  interpolation: { escapeValue: false }, // RN ja escapa; sem XSS aqui
  returnNull: false,
});

export default i18n;
