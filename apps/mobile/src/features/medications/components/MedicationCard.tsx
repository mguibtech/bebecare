/**
 * Card de medicamento — layout horizontal denso.
 *
 *   ┌───────────────────────────────────────────────┐
 *   │ Vitamina D                       [● Ativo]    │
 *   │ 400 gotas • 08:00, 20:00 • Diário             │
 *   └───────────────────────────────────────────────┘
 *
 * Inativos ficam translucido. Tap abre o detalhe.
 */

import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { MutedText } from '@/shared/components';
import type { AppTheme } from '@/app/theme';

import {
  ALL_DAYS_MASK,
  DOSE_UNIT_LABELS,
  WEEKDAYS_MASK,
  WEEKEND_MASK,
  type Medication,
} from '../types';

type MedicationCardProps = {
  medication: Medication;
  onPress: () => void;
};

/** Resumo dos schedules em texto: "08:00, 20:00 • Diário". */
function summarize(medication: Medication): string {
  const schedules = medication.schedules.filter((s) => s.isActive);
  const first = schedules[0];
  if (!first) return 'Sem horários ativos';

  const times = schedules
    .map((s) => s.time)
    .sort()
    .join(', ');

  // Detecta padrao mais comum dos dias
  const firstMask = first.daysOfWeekMask;
  const allSameMask = schedules.every(
    (s) => s.daysOfWeekMask === firstMask,
  );
  const daysLabel = allSameMask
    ? firstMask === ALL_DAYS_MASK
      ? 'Diário'
      : firstMask === WEEKDAYS_MASK
        ? 'Dias úteis'
        : firstMask === WEEKEND_MASK
          ? 'Fim de semana'
          : `${first.daysOfWeekNames.join(', ')}`
    : 'Dias variados';

  return `${times} • ${daysLabel}`;
}

export function MedicationCard({
  medication,
  onPress,
}: MedicationCardProps) {
  const theme = useTheme<AppTheme>();
  const dose = Number(medication.dose);
  const unitLabel = DOSE_UNIT_LABELS[medication.doseUnit];

  const opacity = medication.isActive ? 1 : 0.6;

  return (
    <Card mode="outlined" onPress={onPress} style={[styles.card, { opacity }]}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text variant="titleSmall" style={styles.name} numberOfLines={1}>
            {medication.name}
          </Text>
          <MutedText variant="bodySmall" numberOfLines={1}>
            {dose} {unitLabel} • {summarize(medication)}
          </MutedText>
        </View>
        <MaterialCommunityIcons
          name={medication.isActive ? 'pill' : 'pill-off'}
          size={20}
          color={
            medication.isActive
              ? theme.colors.primary
              : theme.app.text.muted
          }
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '700',
  },
});
