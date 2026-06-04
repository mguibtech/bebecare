/**
 * Configuracao de ambiente do app.
 *
 * NOTA: usando constantes inline por enquanto. Quando precisarmos de
 * builds separados (dev/staging/prod) substituir por react-native-config
 * com arquivos .env.* na raiz de apps/mobile.
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
 * Usa `localhost` no Android tambem: com `adb reverse tcp:3000 tcp:3000`
 * o localhost:3000 do aparelho (device fisico OU emulador) e' mapeado pro
 * PC. O script `npm run adb` ja faz esse reverse. Sem isso, no device fisico
 * o `10.0.2.2` (atalho so de emulador) nao alcanca o PC.
 *
 * - iOS simulator: localhost funciona direto
 */
const API_BASE_URL_DEV = Platform.select({
  android: 'http://localhost:3000/api',
  ios: 'http://localhost:3000/api',
  default: 'http://localhost:3000/api',
});

export const env = {
  API_BASE_URL: API_BASE_URL_DEV,
  APP_NAME: 'BebeCare',
  // Tempo em ms apos o qual um cache do React Query e considerado stale.
  QUERY_STALE_TIME: 1000 * 60 * 5, // 5 min
} as const;

export type Env = typeof env;
