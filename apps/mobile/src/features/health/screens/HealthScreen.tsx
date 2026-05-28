/**
 * Tab Saúde — placeholder enquanto M5 (consultas) e M6 (medicamentos) não chegam.
 *
 * Empty state com voz de marca: explica o que vai chegar em vez de ser
 * um "em breve" frio. Quando M5 mergear, essa tela vira um sub-Stack ou
 * Material Top Tabs com Consultas + Remédios.
 */

import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
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
      <View style={styles.header}>
        <MaterialCommunityIcons
          name="heart-pulse"
          size={64}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.title}>
          Saúde do bebê
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.app.text.muted }]}
        >
          Em breve, tudo num lugar só.
        </Text>
      </View>

      {/* Preview do que vai chegar */}
      <Card
        mode="outlined"
        style={styles.previewCard}
      >
        <Card.Content style={styles.previewContent}>
          <MaterialCommunityIcons
            name="stethoscope"
            size={32}
            color={theme.colors.primary}
          />
          <View style={styles.previewText}>
            <Text variant="titleMedium" style={styles.previewTitle}>
              Consultas pediátricas
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.app.text.muted }}
            >
              Agende, receba lembretes, anote o que o pediatra disse.
            </Text>
          </View>
        </Card.Content>
      </Card>

      <Card mode="outlined" style={styles.previewCard}>
        <Card.Content style={styles.previewContent}>
          <MaterialCommunityIcons
            name="pill"
            size={32}
            color={theme.colors.primary}
          />
          <View style={styles.previewText}>
            <Text variant="titleMedium" style={styles.previewTitle}>
              Medicamentos
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.app.text.muted }}
            >
              Cadastre remédios com horários, receba alarmes para cada dose.
            </Text>
          </View>
        </Card.Content>
      </Card>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  title: {
    fontWeight: '700',
    marginTop: 12,
  },
  subtitle: {
    marginTop: 4,
  },
  previewCard: {
    marginBottom: 12,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  previewText: {
    flex: 1,
    gap: 2,
  },
  previewTitle: {
    fontWeight: '600',
  },
});
