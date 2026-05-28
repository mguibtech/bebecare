import { MD3DarkTheme, MD3LightTheme, configureFonts } from 'react-native-paper';

import {
  palettes,
  radii,
  spacing,
  type PaletteName,
  type ThemeColors,
  type ThemeMode,
} from './tokens';

/**
 * Hex 0-1 alpha → 2-digit hex string ('00' a 'FF').
 * Util pra criar variacoes translucidas de cores solidas.
 */
function alpha(value: number): string {
  const v = Math.max(0, Math.min(1, value));
  return Math.round(v * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
}

/**
 * Constroi o tema do Paper para uma combinacao paleta+modo.
 *
 * - Base: MD3LightTheme ou MD3DarkTheme (dependendo do modo do sistema).
 * - Sobrescreve as cores principais com a paleta escolhida.
 * - Expoe tokens proprios em `theme.app`:
 *   - layout: spacing, radii
 *   - meta:   palette, mode
 *   - text:   primary, secondary, muted, success, error, warning
 *             (em vez de `opacity: 0.7` espalhado, use color: theme.app.text.muted)
 *
 * Acessar tudo via `useTheme<AppTheme>()` em qualquer componente.
 */
export function buildTheme(palette: PaletteName, mode: ThemeMode) {
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const colors: ThemeColors = palettes[palette][mode];

  // ----- Tokens semanticos de texto -----
  // muted = onSurface com transparencia (~70% em light, ~75% em dark) —
  // mais escuro em light pra manter contraste WCAG sobre fundo claro;
  // mais opaco em dark pra texto cinza nao sumir em fundo escuro.
  const mutedAlphaHex = mode === 'dark' ? alpha(0.75) : alpha(0.7);
  const secondaryAlphaHex = mode === 'dark' ? alpha(0.85) : alpha(0.8);

  const textTokens = {
    /** Texto principal (titulos, conteudo). */
    primary: colors.onBackground,
    /** Texto secundario (subtitulos, descricoes). */
    secondary: colors.onSurface + secondaryAlphaHex,
    /** Texto desbotado (datas, metadados, hints). */
    muted: colors.onSurface + mutedAlphaHex,
    /** Texto de sucesso (chips, mensagens positivas). */
    success: colors.success,
    /** Texto de erro (mensagens negativas, validacao). */
    error: colors.error,
    /** Texto de warning (avisos amarelos). */
    warning: colors.warning,
  } as const;

  return {
    ...base,
    dark: mode === 'dark',
    colors: {
      ...base.colors,
      primary: colors.primary,
      primaryContainer: colors.primaryContainer,
      secondary: colors.secondary,
      secondaryContainer: colors.secondaryContainer,
      tertiary: colors.tertiary,
      background: colors.background,
      surface: colors.surface,
      surfaceVariant: colors.surfaceVariant,
      error: colors.error,
      onPrimary: colors.onPrimary,
      onSecondary: colors.onSecondary,
      onSecondaryContainer: colors.onSecondaryContainer,
      onBackground: colors.onBackground,
      onSurface: colors.onSurface,
      outline: colors.outline,
    },
    fonts: configureFonts({ config: { fontFamily: 'System' } }),
    // Tokens proprios — acessiveis via useTheme<AppTheme>()
    app: {
      spacing,
      radii,
      // Info da paleta atual (util pra componentes que queiram reagir,
      // ex.: ilustracoes/icones que mudam com paleta).
      palette,
      mode,
      // Cores "estendidas" que o MD3 nao tem — success/warning.
      success: colors.success,
      warning: colors.warning,
      /**
       * Tokens semanticos de texto. Preferir SEMPRE a `style={{ opacity: 0.7 }}`.
       * Exemplos:
       *   <Text style={{ color: theme.app.text.muted }}>14/10/2025</Text>
       *   <Text style={{ color: theme.app.text.error }}>Senha invalida</Text>
       */
      text: textTokens,
    },
  } as const;
}

/** Tipo derivado pra useTheme<AppTheme>(). */
export type AppTheme = ReturnType<typeof buildTheme>;

export { palettes, spacing, radii };
export type { PaletteName, ThemeMode };
