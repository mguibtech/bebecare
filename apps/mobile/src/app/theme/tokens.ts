/**
 * Design tokens do BebeCare.
 *
 * Suporta 2 paletas (rosa, azul) e 2 modos (light, dark) = 4 temas.
 * A paleta e' escolhida pelo usuário; o modo segue o sistema operacional
 * (useColorScheme do RN).
 *
 * Diretrizes:
 * - Manter contraste WCAG AA mesmo em dark.
 * - "secondary" (cor solida) de cada paleta usa a paleta OPOSTA (rosa↔azul)
 *   para uso pontual em accents (FAB, Chip secundario, etc.) — evita tela
 *   monocromatica sem confundir a paleta escolhida.
 * - "secondaryContainer" (usado pelo SegmentedButtons selecionado, BadgeMD3,
 *   Chip background) eh variacao da PROPRIA paleta — quando o usuário escolhe
 *   "Rosa", o botao selecionado fica rosa (coerente). NAO eh a paleta oposta.
 * - spacing/radii são iguais nos 4 temas — são tokens de layout, não de cor.
 */

// ============================================================
// MARCA (cores fixas — NAO mudam com paleta/modo)
// ============================================================

/**
 * Cores da identidade visual (logo, gradiente, ícone do app).
 * Diferente das paletas: a marca e' sempre a mesma, independente de o
 * usuário ter escolhido tema azul/rosa ou light/dark.
 *
 * Obs.: o gerador de ícone (scripts/gen-icons.mjs) espelha estes hex
 * manualmente — e' um script Node, fora do bundle RN. Manter em sincronia.
 */
export const brand = {
  blue: '#5B9BD5',
  pink: '#F4A6B8',
} as const;

/** Stops do gradiente da marca (azul -> rosa). */
export const brandGradient = [brand.blue, brand.pink] as const;

// ============================================================
// PALETAS
// ============================================================

const azulLight = {
  // Azul-bebê aprofundado pra texto branco passar WCAG AA (4.61:1 vs 2.96 do
  // brand.blue #5B9BD5). brand.blue segue intacto pra logo/ícone/gradiente.
  primary: '#3A7AAC',
  primaryContainer: '#DBE9F8',
  secondary: '#F4A6B8', // rosa solido — accent pontual
  secondaryContainer: '#C7DCF2', // azul mais saturado pra seleao/badge
  tertiary: '#B8A4D9', // lavanda
  background: '#FAFAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F1F4',
  error: '#D32F2F',
  success: '#2E7D32',
  warning: '#ED6C02',
  onPrimary: '#FFFFFF',
  onSecondary: '#3A1620',
  onSecondaryContainer: '#0F2543', // azul muito escuro pra texto sobre selecao
  onBackground: '#1A1A1F',
  onSurface: '#1A1A1F',
  outline: '#C7C7CC',
} as const;

const azulDark = {
  primary: '#8FBFE8',
  primaryContainer: '#1F3A57',
  secondary: '#F8C0CB',
  secondaryContainer: '#2B4A6E', // azul escuro pra selecao em dark
  tertiary: '#CFBDE6',
  background: '#0F1620',
  surface: '#1A2233',
  surfaceVariant: '#222D40',
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  onPrimary: '#0A1A2A',
  onSecondary: '#2A0E15',
  onSecondaryContainer: '#D6E4F2', // azul muito claro pra texto sobre selecao
  onBackground: '#E6EAF2',
  onSurface: '#E6EAF2',
  outline: '#4A5568',
} as const;

const rosaLight = {
  primary: '#E5577E', // rosa coral vibrante
  primaryContainer: '#FFE0E8',
  secondary: '#7FB8E5', // azul solido — accent pontual
  secondaryContainer: '#FBC4D2', // rosa mais saturado pra selecao
  tertiary: '#B8A4D9',
  background: '#FFF8FA',
  surface: '#FFFFFF',
  surfaceVariant: '#F8EEF1',
  error: '#D32F2F',
  success: '#2E7D32',
  warning: '#ED6C02',
  onPrimary: '#FFFFFF',
  onSecondary: '#0F1F33',
  onSecondaryContainer: '#5C1F32', // rosa muito escuro pra texto sobre selecao
  onBackground: '#1F1518',
  onSurface: '#1F1518',
  outline: '#D6BFC8',
} as const;

const rosaDark = {
  primary: '#FF95B0',
  primaryContainer: '#622237',
  secondary: '#A8D0F0',
  secondaryContainer: '#7A2F44', // rosa escuro pra selecao em dark
  tertiary: '#CFBDE6',
  background: '#1F1518',
  surface: '#2A1D20',
  surfaceVariant: '#3A282C',
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  onPrimary: '#3A0F1D',
  onSecondary: '#0A1A2A',
  onSecondaryContainer: '#FCE6EE', // rosa muito claro pra texto sobre selecao
  onBackground: '#F5E8ED',
  onSurface: '#F5E8ED',
  outline: '#6E4A55',
} as const;

// ============================================================
// MAPA DE PALETAS — usado pelo theme builder
// ============================================================

export const palettes = {
  azul: { light: azulLight, dark: azulDark },
  rosa: { light: rosaLight, dark: rosaDark },
} as const;

export type PaletteName = keyof typeof palettes; // 'azul' | 'rosa'
export type ThemeMode = 'light' | 'dark';

/**
 * Cores de uma combinacao paleta+modo. Mesmo shape em todas.
 * Valores são widened pra string porque cada paleta tem seus hex literais
 * (com `as const`) e o tipo precisa aceitar qualquer paleta.
 */
export type ThemeColors = { readonly [K in keyof typeof azulLight]: string };

// ============================================================
// LAYOUT TOKENS (iguais nos 4 temas)
// ============================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 4,
  md: 8,
  lg: 16,
  full: 9999,
} as const;

export type Spacing = typeof spacing;
export type Radii = typeof radii;

// Labels de paleta (Azul/Rosa) agora vêm da i18n: t('appearance.palette*').
