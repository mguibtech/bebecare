/**
 * Chip de status de vacina (Aplicada/Atrasada/No prazo/Em breve).
 * Cores e ícone derivam do tema via getStatusVisuals.
 */

import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import type { AppTheme } from '@/app/theme';

import { getStatusVisuals } from '../utils/statusVisuals';
import type { VaccineStatus } from '../types';

type StatusChipProps = {
  status: VaccineStatus;
  /** Tamanho compacto (lista) ou normal (detalhe). */
  compact?: boolean;
};

export function StatusChip({ status, compact }: StatusChipProps) {
  const theme = useTheme<AppTheme>();
  const visual = getStatusVisuals(status, theme);

  const padH = compact ? 8 : 12;
  const padV = compact ? 2 : 4;
  const fontSize = compact ? 11 : 13;
  const iconSize = compact ? 12 : 14;

  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: visual.backgroundColor,
          paddingHorizontal: padH,
          paddingVertical: padV,
        },
      ]}
    >
      <MaterialCommunityIcons
        name={visual.icon}
        size={iconSize}
        color={visual.color}
      />
      <Text style={[styles.label, { color: visual.color, fontSize }]}>
        {visual.label}
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
