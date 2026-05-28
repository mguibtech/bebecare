/**
 * Tab Saúde — agrega Consultas (M5) e Remédios (M6).
 *
 * Sub-tabs via SegmentedButtons no topo. Quando M6 entrar, "Remédios"
 * vira tela real; por enquanto fica placeholder convidativo.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, SegmentedButtons, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { MutedText } from '@/shared/components';
import { AppointmentsListScreen } from '@/features/appointments/screens/AppointmentsListScreen';
import type { AppTheme } from '@/app/theme';

type HealthTab = 'appointments' | 'medications';

function MedicationsPlaceholder() {
  const theme = useTheme<AppTheme>();
  return (
    <View
      style={[
        styles.placeholderRoot,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <MaterialCommunityIcons
        name="pill"
        size={64}
        color={theme.colors.primary}
      />
      <Text variant="headlineSmall" style={styles.placeholderTitle}>
        Remédios em breve
      </Text>
      <MutedText variant="bodyMedium" style={styles.placeholderBody}>
        Cadastre medicamentos com horários e receba alarmes para cada dose.
      </MutedText>
      <Card mode="outlined" style={styles.previewCard}>
        <Card.Content style={styles.previewContent}>
          <MaterialCommunityIcons
            name="alarm"
            size={24}
            color={theme.colors.primary}
          />
          <View style={styles.previewText}>
            <Text variant="titleSmall" style={styles.previewTitle}>
              Alarmes confiáveis
            </Text>
            <MutedText variant="bodySmall">
              Notificação local + som — não depende de internet.
            </MutedText>
          </View>
        </Card.Content>
      </Card>
    </View>
  );
}

export function HealthScreen() {
  const theme = useTheme<AppTheme>();
  const [tab, setTab] = useState<HealthTab>('appointments');

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <View style={styles.tabsRow}>
        <SegmentedButtons
          value={tab}
          onValueChange={(v) => setTab(v as HealthTab)}
          buttons={[
            {
              value: 'appointments',
              label: 'Consultas',
              icon: 'stethoscope',
            },
            {
              value: 'medications',
              label: 'Remédios',
              icon: 'pill',
            },
          ]}
        />
      </View>

      <View style={styles.content}>
        {tab === 'appointments' ? (
          <AppointmentsListScreen />
        ) : (
          <MedicationsPlaceholder />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabsRow: {
    padding: 16,
    paddingBottom: 4,
  },
  content: { flex: 1 },
  placeholderRoot: {
    flex: 1,
    alignItems: 'center',
    padding: 32,
  },
  placeholderTitle: {
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  placeholderBody: {
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  previewCard: {
    width: '100%',
    marginTop: 16,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  previewText: {
    flex: 1,
  },
  previewTitle: {
    fontWeight: '600',
  },
});
