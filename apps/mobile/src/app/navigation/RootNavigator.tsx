import { useEffect, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import {
  DarkTheme as NavDarkTheme,
  DefaultTheme as NavDefaultTheme,
  NavigationContainer,
  type Theme as NavTheme,
} from '@react-navigation/native';
import { useTheme } from 'react-native-paper';

import { useAuthStore } from '@/features/auth/store/auth.store';
import type { AppTheme } from '@/app/theme';

import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';
import { linking } from './linking';

/**
 * Decide qual stack montar baseado no status do auth.
 * Durante 'booting' mostra splash interno (hidrata do Keychain).
 *
 * Tambem deriva o tema do React Navigation a partir do tema do Paper —
 * sem isso, header e content background ficariam sempre brancos mesmo
 * em modo escuro. A integracao garante coerencia visual.
 */
export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);
  const paperTheme = useTheme<AppTheme>();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Tema do RN Navigation derivado do Paper.
  // Memoiza pra nao criar objeto novo a cada render (NavigationContainer
  // reage a mudanca de identidade).
  const navTheme = useMemo<NavTheme>(() => {
    const base = paperTheme.dark ? NavDarkTheme : NavDefaultTheme;
    return {
      ...base,
      dark: paperTheme.dark,
      colors: {
        ...base.colors,
        primary: paperTheme.colors.primary,
        background: paperTheme.colors.background,
        card: paperTheme.colors.surface,
        text: paperTheme.colors.onSurface,
        border: paperTheme.colors.outline,
        notification: paperTheme.colors.error,
      },
    };
  }, [paperTheme]);

  if (status === 'booting') {
    return (
      <View
        style={[
          styles.splash,
          { backgroundColor: paperTheme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme} linking={linking}>
      {status === 'authenticated' ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
