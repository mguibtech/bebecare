import { useEffect, type PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { useAppTheme } from '@/app/theme/useAppTheme';
import { useThemeStore } from '@/app/theme/store';

import { queryClient } from './queryClient';

/**
 * Composicao de providers globais.
 * Ordem importa:
 *  GestureHandlerRoot  (peer obrigatorio do React Navigation)
 *  SafeArea            (insets disponiveis para tudo abaixo)
 *  Query               (cache de server-state)
 *  Paper               (tema reativo a paleta + modo do sistema)
 *
 * O tema do Paper reage automaticamente a:
 *  - paleta escolhida (useThemeStore)
 *  - modo light/dark do sistema (useColorScheme dentro de useAppTheme)
 */
export function AppProviders({ children }: PropsWithChildren) {
  const theme = useAppTheme();
  const hydrateTheme = useThemeStore((s) => s.hydrate);

  // Hidrata a preferencia de paleta do MMKV no boot (sincrono, rapido).
  // Roda 1x — paleta inicial vem do default ate este efeito disparar.
  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>{children}</PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
