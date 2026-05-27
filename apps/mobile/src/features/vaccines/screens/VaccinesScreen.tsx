/**
 * Placeholder da tab Vacinas. Implementacao real no M4 (calendario PNI).
 */

import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import type { AppTheme } from '@/app/theme';

export function VaccinesScreen() {
  const theme = useTheme<AppTheme>();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <MaterialCommunityIcons
        name="needle"
        size={64}
        color={theme.colors.primary}
      />
      <Text variant="titleLarge" style={styles.title}>
        Vacinas (em breve)
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Calendario completo do PNI do seu bebe, com lembretes de doses
        atrasadas e proximas. Disponivel no proximo update.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    opacity: 0.7,
    textAlign: 'center',
  },
});
