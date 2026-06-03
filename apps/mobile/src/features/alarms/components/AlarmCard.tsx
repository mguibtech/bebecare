/**
 * Card de um despertador na lista. Mostra horario grande, label, dias e
 * categoria. Switch liga/desliga sem abrir o form. Tap no corpo edita.
 */

import { StyleSheet, View } from 'react-native';
import { Card, Switch, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { MutedText } from '@/shared/components';
import type { AppTheme } from '@/app/theme';

import {
  ALARM_CATEGORY_ICONS,
  ALARM_CATEGORY_LABELS,
  ALL_DAYS_MASK,
  DAY_LABELS,
  WEEKDAYS_MASK,
  WEEKEND_MASK,
  daysFromMask,
  type Alarm,
} from '../types';

export function formatDays(mask: number): string {
  if (mask === ALL_DAYS_MASK) return 'Todos os dias';
  if (mask === WEEKDAYS_MASK) return 'Dias úteis';
  if (mask === WEEKEND_MASK) return 'Fim de semana';
  return daysFromMask(mask)
    .map((d) => DAY_LABELS[d])
    .join(', ');
}

export type AlarmCardProps = {
  alarm: Alarm;
  busy?: boolean;
  onToggle: (next: boolean) => void;
  onPress: () => void;
};

export function AlarmCard({ alarm, busy, onToggle, onPress }: AlarmCardProps) {
  const theme = useTheme<AppTheme>();
  const accent = alarm.isActive ? theme.colors.primary : theme.app.text.muted;

  return (
    <Card mode="outlined" style={styles.card} onPress={onPress}>
      <Card.Content style={styles.content}>
        <MaterialCommunityIcons
          name={ALARM_CATEGORY_ICONS[alarm.category]}
          size={28}
          color={accent}
        />

        <View style={styles.info}>
          <Text variant="headlineSmall" style={[styles.time, { color: accent }]}>
            {alarm.time}
          </Text>
          <Text variant="titleSmall" numberOfLines={1}>
            {alarm.label}
          </Text>
          <MutedText variant="bodySmall">
            {alarm.intervalHours
              ? `A cada ${alarm.intervalHours}h • `
              : ''}
            {ALARM_CATEGORY_LABELS[alarm.category]} • {formatDays(alarm.daysOfWeekMask)}
          </MutedText>
        </View>

        <Switch
          value={alarm.isActive}
          onValueChange={onToggle}
          disabled={busy}
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  info: {
    flex: 1,
    gap: 1,
  },
  time: {
    fontWeight: '700',
  },
});
