/**
 * Chip de status de consulta. Cores por status:
 *  - SCHEDULED: primary (azul/rosa do tema)
 *  - COMPLETED: success (verde)
 *  - CANCELED:  muted (cinza)
 *  - MISSED:    error (vermelho)
 */

import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import type { AppTheme } from '@/app/theme';

import {
  AppointmentStatus,
  APPOINTMENT_STATUS_LABELS,
} from '../types';

type StatusChipProps = {
  status: AppointmentStatus;
  compact?: boolean;
};

function getVisuals(status: AppointmentStatus, theme: AppTheme) {
  switch (status) {
    case AppointmentStatus.SCHEDULED:
      return {
        icon: 'calendar-clock',
        color: theme.colors.primary,
        bg: theme.colors.primary + '24',
      };
    case AppointmentStatus.COMPLETED:
      return {
        icon: 'check-circle',
        color: theme.app.success,
        bg: theme.app.success + '24',
      };
    case AppointmentStatus.CANCELED:
      return {
        icon: 'close-circle-outline',
        color: theme.app.text.muted,
        bg: theme.colors.surfaceVariant,
      };
    case AppointmentStatus.MISSED:
      return {
        icon: 'alert-circle',
        color: theme.colors.error,
        bg: theme.colors.error + '24',
      };
  }
}

export function StatusChip({ status, compact }: StatusChipProps) {
  const theme = useTheme<AppTheme>();
  const v = getVisuals(status, theme);

  const padH = compact ? 8 : 12;
  const padV = compact ? 2 : 4;
  const fontSize = compact ? 11 : 13;
  const iconSize = compact ? 12 : 14;

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: v.bg,
          paddingHorizontal: padH,
          paddingVertical: padV,
        },
      ]}
    >
      <MaterialCommunityIcons name={v.icon} size={iconSize} color={v.color} />
      <Text style={[styles.label, { color: v.color, fontSize }]}>
        {APPOINTMENT_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    gap: 4,
  },
  label: {
    fontWeight: '600',
  },
});
