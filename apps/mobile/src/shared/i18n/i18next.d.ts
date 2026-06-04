/**
 * Tipa as chaves do t() a partir do catalogo pt (fonte-de-verdade).
 * Chave inexistente vira erro de build.
 */
import 'i18next';
import type { TranslationCatalog } from './locales/pt';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: TranslationCatalog };
  }
}
