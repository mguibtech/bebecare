import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import { useAuthStore } from '@/features/auth/store/auth.store';

import { AppNavigator } from './AppNavigator';
import { AuthNavigator } from './AuthNavigator';

/**
 * Decide qual stack montar baseado no status do auth.
 * Durante 'booting' mostra splash interno (hidrata do Keychain).
 */
export function RootNavigator() {
  const status = useAuthStore((s) => s.status);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (status === 'booting') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
