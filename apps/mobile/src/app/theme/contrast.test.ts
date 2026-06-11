/**
 * Acessibilidade — contraste WCAG 2.1 AA das 4 combinações paleta×modo.
 *
 * Guard-rail pedido no DESIGN_REVIEW.md (#10): falha se algum par texto/fundo
 * regredir abaixo do limiar. Limiares:
 *   - texto normal (corpo): 4.5:1
 *   - acento/status/componente de UI: 3:1 (mínimo WCAG p/ texto grande e não-texto)
 *
 * Tokens de texto translúcido (muted/secondary = onSurface + alpha) são
 * achatados sobre o fundo antes de medir — espelha o render real do RN.
 *
 * EXCEÇÕES CONHECIDAS (KNOWN_BELOW): pares de cor de marca que hoje ficam abaixo
 * do limiar. São documentados aqui com o valor atual e um guard de regressão
 * (não podem piorar). Decisão de design pendente — ver nota em cada um.
 */
import {
  palettes,
  type PaletteName,
  type ThemeColors,
  type ThemeMode,
} from './tokens';
import { contrastRatio, flatten } from './contrast';

// Mantém em sync com buildTheme() em index.ts.
const MUTED_ALPHA = { light: 0.7, dark: 0.75 } as const;
const SECONDARY_ALPHA = { light: 0.8, dark: 0.85 } as const;

const AA_TEXT = 4.5;
const AA_LARGE = 3.0;

type Pair = {
  name: string;
  min: number;
  ratio: (c: ThemeColors, m: ThemeMode) => number;
};

// Texto de corpo — exige AA normal (4.5:1).
const BODY: Pair[] = [
  { name: 'texto primário / background', min: AA_TEXT, ratio: (c) => contrastRatio(c.onBackground, c.background) },
  { name: 'texto primário / surface', min: AA_TEXT, ratio: (c) => contrastRatio(c.onSurface, c.surface) },
  { name: 'texto secundário / surface', min: AA_TEXT, ratio: (c, m) => contrastRatio(flatten(c.onSurface, SECONDARY_ALPHA[m], c.surface), c.surface) },
  { name: 'texto muted / surface', min: AA_TEXT, ratio: (c, m) => contrastRatio(flatten(c.onSurface, MUTED_ALPHA[m], c.surface), c.surface) },
  { name: 'label selecionado / secondaryContainer', min: AA_TEXT, ratio: (c) => contrastRatio(c.onSecondaryContainer, c.secondaryContainer) },
];

// Acentos/status/UI — limiar 3:1 (uso pontual: botões, chips, ícones, labels grandes).
const ACCENT: Pair[] = [
  { name: 'onPrimary / primary', min: AA_LARGE, ratio: (c) => contrastRatio(c.onPrimary, c.primary) },
  { name: 'onSecondary / secondary', min: AA_LARGE, ratio: (c) => contrastRatio(c.onSecondary, c.secondary) },
  { name: 'success / surface', min: AA_LARGE, ratio: (c) => contrastRatio(c.success, c.surface) },
  { name: 'error / surface', min: AA_LARGE, ratio: (c) => contrastRatio(c.error, c.surface) },
  { name: 'warning / surface', min: AA_LARGE, ratio: (c) => contrastRatio(c.warning, c.surface) },
];

/**
 * Pares de marca abaixo do limiar (exceções documentadas). Chave:
 * `${palette}-${mode} | ${pair}`. `current` = razão medida; o teste só garante
 * que NÃO piore (guard de regressão). Vazio agora — todos os pares passam o
 * limiar da sua categoria. Manter o mecanismo pra futuras exceções de marca.
 */
const KNOWN_BELOW: Record<string, { current: number; note: string }> = {};

const THEMES: Array<[PaletteName, ThemeMode]> = [
  ['azul', 'light'],
  ['azul', 'dark'],
  ['rosa', 'light'],
  ['rosa', 'dark'],
];

describe('contraste WCAG AA (4 paletas × modos)', () => {
  for (const [palette, mode] of THEMES) {
    const c = palettes[palette][mode];
    describe(`${palette}-${mode}`, () => {
      for (const pair of [...BODY, ...ACCENT]) {
        const exception = KNOWN_BELOW[`${palette}-${mode} | ${pair.name}`];
        it(`${pair.name} ≥ ${exception ? `${exception.current} (exceção)` : `${pair.min}`}:1`, () => {
          const ratio = Number(pair.ratio(c, mode).toFixed(2));
          if (exception) {
            // Guard de regressão: não pode ficar abaixo do valor documentado.
            expect(ratio).toBeGreaterThanOrEqual(exception.current);
          } else {
            expect(ratio).toBeGreaterThanOrEqual(pair.min);
          }
        });
      }
    });
  }
});
