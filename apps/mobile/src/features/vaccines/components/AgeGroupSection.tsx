/**
 * Header de uma secçao do calendario por idade ("Ao nascer", "2 meses"...).
 *
 * Mostra label de idade + mini-resumo de contagens (X de Y aplicadas, e
 * destaque vermelho se ha atrasadas).
 */

import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import type { AppTheme } from '@/app/theme';

import { VaccineStatus } from '../types';
import type { AgeGroup } from '../utils/groupByAge';

type AgeGroupSectionProps = {
  group: AgeGroup;
};

export function AgeGroupSection({ group }: AgeGroupSectionProps) {
  const theme = useTheme<AppTheme>();

  const total = group.entries.length;
  const applied = group.counts[VaccineStatus.APPLIED];
  const overdue = group.counts[VaccineStatus.OVERDUE];

  const allApplied = applied === total;
  const summaryText = allApplied
    ? `Tudo em dia (${total}/${total})`
    : `${applied} de ${total} aplicadas`;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text variant="titleMedium" style={styles.title}>
          {group.ageLabel}
        </Text>
        {allApplied && (
          <MaterialCommunityIcons
            name="check-decagram"
            size={18}
            color={theme.app.success}
          />
        )}
      </View>
      <View style={styles.subRow}>
        <Text variant="bodySmall" style={styles.summary}>
          {summaryText}
        </Text>
        {overdue > 0 && (
          <View style={styles.overdueBadge}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={12}
              color={theme.colors.error}
            />
            <Text
              variant="bodySmall"
              style={[styles.overdueText, { color: theme.colors.error }]}
            >
              {overdue} atrasada{overdue > 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontWeight: '700',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 2,
  },
  summary: {
    opacity: 0.7,
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  overdueText: {
    fontWeight: '600',
  },
});
