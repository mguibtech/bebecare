/**
 * Configuracao de ambiente do app.
 *
 * A URL de produção é inserida pelo Babel durante o build de distribuição,
 * sem ficar gravada no repositório. Ver scripts/distribute.mjs e DEPLOY.md.
 */

import { Platform } from 'react-native';

/**
 * URL base da API NestJS.
 *
 * Inclui o globalPrefix '/api' que o backend configura em main.ts:
 *   app.setGlobalPrefix('api');
 * Por isso TODOS os paths nas funcoes de api.ts ficam relativos
 * ('/auth/login', '/babies', etc.) sem precisar repetir '/api' manualmente.
 *
 * Usa `localhost` no Android também: com `adb reverse tcp:3000 tcp:3000`
 * o localhost:3000 do aparelho (device fisico OU emulador) e' mapeado pro
 * PC. O script `npm run adb` já faz esse reverse. Sem isso, no device fisico
 * o `10.0.2.2` (atalho so de emulador) não alcanca o PC.
 *
 * - iOS simulator: localhost funciona direto
 */
const API_BASE_URL_DEV = Platform.select({
  android: 'http://localhost:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});

/**
 * Marcador substituído pelo plugin Babel por BEBECARE_API_BASE_URL no build de
 * release. A URL é pública (não é segredo), mas só passa a existir depois que
 * o Railway gerar o domínio do serviço.
 */
declare const __BEBECARE_API_BASE_URL__: string;
const API_BASE_URL_PROD = __BEBECARE_API_BASE_URL__;

/** Valida e normaliza a URL pública que será embutida no APK de release. */
export function resolveProductionApiBaseUrl(value: string): string {
  const rawValue = value.trim();
  if (!rawValue) {
    throw new Error(
      'URL da API de produção ausente. Configure BEBECARE_API_BASE_URL antes de gerar o APK.',
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawValue);
  } catch {
    throw new Error('BEBECARE_API_BASE_URL deve ser uma URL HTTPS válida.');
  }

  const path = parsedUrl.pathname.replace(/\/+$/, '');
  if (
    parsedUrl.protocol !== 'https:' ||
    path !== '/api' ||
    parsedUrl.search ||
    parsedUrl.hash
  ) {
    throw new Error(
      'BEBECARE_API_BASE_URL deve usar HTTPS, terminar em /api e não ter query ou fragment.',
    );
  }

  return `${parsedUrl.origin}${path}`;
}

export const env = {
  API_BASE_URL: __DEV__
    ? API_BASE_URL_DEV
    : resolveProductionApiBaseUrl(API_BASE_URL_PROD),
  APP_NAME: 'BebeCare',
  // Tempo em ms apos o qual um cache do React Query e considerado stale.
  QUERY_STALE_TIME: 1000 * 60 * 5, // 5 min
} as const;

export type Env = typeof env;
