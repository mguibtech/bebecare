import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Idioma da resposta, resolvido do header `Accept-Language`.
 *
 * Leve de propósito (sem nestjs-i18n): só precisamos localizar o conteúdo do
 * catálogo de vacinas (nome/descrição/doseLabel). Default `pt` quando o header
 * falta ou pede um idioma não suportado.
 */
export type Lang = 'pt' | 'en';

const SUPPORTED: readonly Lang[] = ['pt', 'en'];
const FALLBACK: Lang = 'pt';

/** "en-US,en;q=0.9,pt;q=0.8" -> "en" (primeira tag, base, suportada). */
export function resolveLang(header?: string): Lang {
  if (!header) return FALLBACK;
  const base = header.split(',')[0]?.trim().split('-')[0]?.toLowerCase() ?? '';
  return (SUPPORTED as readonly string[]).includes(base)
    ? (base as Lang)
    : FALLBACK;
}

/** Param decorator: injeta o `Lang` resolvido do Accept-Language. */
export const Lang = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Lang => {
    const req = ctx
      .switchToHttp()
      .getRequest<{ headers: Record<string, string | undefined> }>();
    return resolveLang(req.headers['accept-language']);
  },
);
