import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { useAuthStore } from '@/features/auth/store/auth.store';

/**
 * Tela placeholder de login.
 * M2 vai substituir por formulario real (react-hook-form + zod)
 * chamando POST /auth/login.
 */
export function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);

  // Login fake so pra validar o boot do app
  const handleFakeLogin = async () => {
    await signIn({
      accessToken: 'fake-jwt',
      refreshToken: 'fake-refresh',
    });
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        BebeCare
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Cuidando do seu bebe, juntos
      </Text>
      <Button mode="contained" onPress={handleFakeLogin} style={styles.button}>
        Entrar (placeholder)
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 8,
    fontWeight: '700',
  },
  subtitle: {
    marginBottom: 32,
    opacity: 0.7,
  },
  button: {
    width: '100%',
  },
});
