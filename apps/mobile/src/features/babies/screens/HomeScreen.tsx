import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

import { useAuthStore } from '@/features/auth/store/auth.store';

/**
 * Home placeholder. Sera substituida por dashboard com
 * proximas vacinas, consultas, medicamentos do(s) bebe(s).
 */
export function HomeScreen() {
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Ola!
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Boot validado. Aqui vai entrar o dashboard.
      </Text>
      <Button mode="outlined" onPress={signOut} style={styles.button}>
        Sair
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
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
