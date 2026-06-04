import { useEffect, type PropsWithChildren } from 'react';
import { AppState, StyleSheet, type AppStateStatus } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider, focusManager } from '@tanstack/react-query';

import { useAppTheme } from '@/app/theme/useAppTheme';
import { useThemeStore } from '@/app/theme/store';
import { useBabySelectorStore } from '@/features/babies/store/baby-selector.store';
import { SnackbarHost } from '@/shared/feedback';

import { queryClient } from './queryClient';

/**
 * Composicao de providers globais.
 * Ordem importa:
 *  GestureHandlerRoot  (peer obrigatório do React Navigation)
 *  SafeArea            (insets disponíveis para tudo abaixo)
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
  const hydrateBabySelector = useBabySelectorStore((s) => s.hydrate);

  // Hidrata stores persistidos no MMKV no boot (sincrono, rapido).
  // Roda 1x — estados iniciais vem dos defaults ate estes efeitos dispararem.
  useEffect(() => {
    hydrateTheme();
    hydrateBabySelector();
  }, [hydrateTheme, hydrateBabySelector]);

  // Liga o focusManager do React Query ao ciclo de vida do app: quando volta
  // pro foreground, queries stale/com-erro refazem sozinhas (recupera de blips
  // de rede sem o usuário precisar de pull-to-refresh).
  useEffect(() => {
    function onAppStateChange(status: AppStateStatus) {
      focusManager.setFocused(status === 'active');
    }
    const sub = AppState.addEventListener('change', onAppStateChange);
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={theme}>
            {children}
            {/* SnackbarHost dentro do Paper porque usa Portal (precisa de PaperProvider acima) */}
            <SnackbarHost />
          </PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
