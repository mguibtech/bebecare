/**
 * Helpers puros de normalizacao de erro HTTP. Sem side-effects nem axios —
 * separado do client.ts pra ser testavel isolado e reutilizavel.
 */

import type { ApiErrorPayload } from './types';

/**
 * Extrai uma mensagem legivel do payload de erro da API.
 *
 * - NestJS manda `message` como string OU string[] (erros de validacao).
 *   No segundo caso, junta com ", ".
 * - Sem payload util, cai no fallback (ex.: error.message do axios) e, por fim,
 *   numa mensagem generica de conexao.
 */
export function extractErrorMessage(
  payload: ApiErrorPayload | undefined,
  fallback?: string,
): string {
  if (Array.isArray(payload?.message)) {
    return payload.message.join(', ');
  }
  return payload?.message ?? fallback ?? 'Erro de conexão';
}
