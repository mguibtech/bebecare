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
 * Constroi o tema do Paper para uma combinacao paleta+modo.
 *
 * - Base: MD3LightTheme ou MD3DarkTheme (dependendo do modo do sistema).
 * - Sobrescreve as cores principais com a paleta escolhida.
 * - Mantem tokens proprios (spacing, radii, palette) acessiveis via
 *   useTheme<AppTheme>() em qualquer componente.
 */
export function buildTheme(palette: PaletteName, mode: ThemeMode) {
  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const colors: ThemeColors = palettes[palette][mode];

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
    },
  } as const;
}

/** Tipo derivado pra useTheme<AppTheme>(). */
export type AppTheme = ReturnType<typeof buildTheme>;

export { palettes, spacing, radii };
export type { PaletteName, ThemeMode };
