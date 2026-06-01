/**
 * Tab Saúde — agrega Consultas (M5) e Remédios (M6).
 *
 * Sub-tabs via SegmentedButtons no topo. Quando M6 entrar, "Remédios"
 * vira tela real; por enquanto fica placeholder convidativo.
 */

import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SegmentedButtons, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppointmentsListScreen } from '@/features/appointments/screens/AppointmentsListScreen';
import { MedicationsListScreen } from '@/features/medications/screens/MedicationsListScreen';
import type { AppTheme } from '@/app/theme';

type HealthTab = 'appointments' | 'medications';

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
          <MedicationsListScreen />
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
});
