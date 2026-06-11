/**
 * Utilitários de contraste WCAG (puros, sem deps de RN).
 *
 * Usados pelo teste de acessibilidade (contrast.test.ts) que valida as 4
 * combinações paleta×modo contra os limiares WCAG 2.1 AA:
 *   - texto normal: 4.5:1
 *   - texto grande / componentes de UI: 3:1
 */

export type RGB = { r: number; g: number; b: number };

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/**
 * Achata uma cor de primeiro plano com opacidade `alpha` (0..1) sobre um fundo
 * opaco — replica o que o RN faz ao renderizar texto translúcido (ex.: os
 * tokens text.muted/secondary, que são onSurface + alpha).
 */
export function flatten(fgHex: string, alpha: number, bgHex: string): RGB {
  const fg = hexToRgb(fgHex);
  const bg = hexToRgb(bgHex);
  const mix = (f: number, b: number) => Math.round(f * alpha + b * (1 - alpha));
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b) };
}

/** Luminância relativa (WCAG). */
function relLuminance({ r, g, b }: RGB): number {
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Razão de contraste WCAG entre duas cores (1..21). Aceita hex ('#RRGGBB') ou RGB. */
export function contrastRatio(a: string | RGB, b: string | RGB): number {
  const la = relLuminance(typeof a === 'string' ? hexToRgb(a) : a);
  const lb = relLuminance(typeof b === 'string' ? hexToRgb(b) : b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
