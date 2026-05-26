import type { PropsWithChildren } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import { appTheme } from '@/app/theme';

import { queryClient } from './queryClient';

/**
 * Composicao de providers globais.
 * Ordem importa:
 *  GestureHandlerRoot  (peer obrigatorio do React Navigation)
 *  SafeArea            (insets disponiveis para tudo abaixo)
 *  Query               (cache de server-state)
 *  Paper               (tema e portal — precisa estar fora do navigator)
 */
export function AppProviders({ children }: PropsWithChildren) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PaperProvider theme={appTheme}>{children}</PaperProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
