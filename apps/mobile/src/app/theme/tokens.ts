/**
 * Design tokens do BebeCare.
 * Paleta inspirada em tons suaves de bebe (rosa/azul/lavanda) com
 * fundo claro e contraste WCAG AA.
 */

export const colors = {
  primary: '#5B9BD5', // azul bebe
  primaryContainer: '#DBE9F8',
  secondary: '#F4A6B8', // rosa suave
  secondaryContainer: '#FCE4EA',
  tertiary: '#B8A4D9', // lavanda
  background: '#FAFAFC',
  surface: '#FFFFFF',
  surfaceVariant: '#F1F1F4',
  error: '#D32F2F',
  success: '#2E7D32',
  warning: '#ED6C02',
  onPrimary: '#FFFFFF',
  onSecondary: '#3A1620',
  onBackground: '#1A1A1F',
  onSurface: '#1A1A1F',
  outline: '#C7C7CC',
} as const;

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

export type Colors = typeof colors;
export type Spacing = typeof spacing;
