/**
 * Placeholder da tab Saude. Implementacao real:
 *  - M5: Consultas pediatricas
 *  - M6: Medicamentos + doses
 *
 * Quando ambas existirem, aqui vai ter um sub-Stack ou Material Top Tabs
 * separando "Consultas" e "Remedios".
 */

import { StyleSheet } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import type { AppTheme } from '@/app/theme';

export function HealthScreen() {
  const theme = useTheme<AppTheme>();

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <MaterialCommunityIcons
        name="heart-pulse"
        size={64}
        color={theme.colors.primary}
      />
      <Text variant="titleLarge" style={styles.title}>
        Saude (em breve)
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Consultas pediatricas e medicamentos com lembretes de doses.
        Disponivel nos proximos updates.
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
