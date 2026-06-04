/**
 * Card de um despertador na lista. Mostra horário grande, label, dias e
 * categoria. Switch liga/desliga sem abrir o form. Tap no corpo edita.
 */

import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { StyleSheet, View } from 'react-native';
import { Card, Switch, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { MutedText } from '@/shared/components';
import type { AppTheme } from '@/app/theme';

import {
  ALARM_CATEGORY_ICONS,
  AlarmCategory,
  ALL_DAYS_MASK,
  DAY_LABELS,
  WEEKDAYS_MASK,
  WEEKEND_MASK,
  daysFromMask,
  type Alarm,
} from '../types';

/** Categoria -> chave i18n do label. */
const CATEGORY_KEY = {
  [AlarmCategory.FEEDING]: 'alarms.catFeeding',
  [AlarmCategory.DIAPER]: 'alarms.catDiaper',
  [AlarmCategory.NAP]: 'alarms.catNap',
  [AlarmCategory.CUSTOM]: 'alarms.catCustom',
} as const;

export function formatDays(mask: number, t: TFunction): string {
  if (mask === ALL_DAYS_MASK) return t('alarms.daysAll');
  if (mask === WEEKDAYS_MASK) return t('alarms.daysWeekdays');
  if (mask === WEEKEND_MASK) return t('alarms.daysWeekend');
  // DAY_LABELS (abreviacoes pt) ainda nao localizadas — fatia de dominio.
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
  const { t } = useTranslation();
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
              ? `${t('alarms.everyHours', { h: alarm.intervalHours })} • `
              : ''}
            {t(CATEGORY_KEY[alarm.category])} •{' '}
            {formatDays(alarm.daysOfWeekMask, t)}
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
