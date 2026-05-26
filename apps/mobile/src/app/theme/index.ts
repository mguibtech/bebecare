import { MD3LightTheme, configureFonts } from 'react-native-paper';

import { colors, radii, spacing } from './tokens';

/**
 * Tema do React Native Paper estendido com tokens proprios.
 * Para usar tokens extras dentro de componentes: useTheme<AppTheme>()
 */
export const appTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
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
    onBackground: colors.onBackground,
    onSurface: colors.onSurface,
    outline: colors.outline,
  },
  fonts: configureFonts({ config: { fontFamily: 'System' } }),
  // Tokens proprios (acessiveis via useTheme<AppTheme>())
  app: {
    spacing,
    radii,
  },
} as const;

export type AppTheme = typeof appTheme;

export { colors, spacing, radii };
