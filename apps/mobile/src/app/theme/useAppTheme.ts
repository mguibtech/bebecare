/**
 * Hook que produz o tema efetivo do app, combinando:
 *   - paleta escolhida pelo usuário (Zustand store)
 *   - modo efetivo, derivado de `modePreference` do store + useColorScheme:
 *       - 'light' ou 'dark' explicito -> override manual
 *       - 'system' -> segue o sistema via useColorScheme do RN
 *
 * Usar APENAS no AppProviders pra injetar no PaperProvider.
 * Componentes que precisam de cores devem usar `useTheme<AppTheme>()`
 * do react-native-paper (que já' tem o tema injetado).
 */

import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { buildTheme } from './index';
import { useThemeStore } from './store';
import type { ThemeMode } from './tokens';

export function useAppTheme() {
  const palette = useThemeStore((s) => s.palette);
  const modePreference = useThemeStore((s) => s.modePreference);
  const systemColorScheme = useColorScheme();

  // Resolve o modo efetivo:
  //  - se o usuário escolheu 'light'/'dark', forca esse
  //  - se escolheu 'system' (default), segue o RN colorScheme
  //  - fallback 'light' quando useColorScheme retorna null no boot
  const mode: ThemeMode =
    modePreference === 'system'
      ? systemColorScheme === 'dark'
        ? 'dark'
        : 'light'
      : modePreference;

  // Memoiza pra evitar rerender em cascata desnecessario quando o objeto
  // do tema seria reconstruido a cada render do Provider.
  return useMemo(() => buildTheme(palette, mode), [palette, mode]);
}
