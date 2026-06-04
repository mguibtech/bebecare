/**
 * Chip de status de vacina (Aplicada/Atrasada/No prazo/Em breve).
 * Cores e ícone derivam do tema via getStatusVisuals.
 */

import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import type { AppTheme } from '@/app/theme';

import { getStatusVisuals } from '../utils/statusVisuals';
import { VaccineStatus } from '../types';

type StatusChipProps = {
  status: VaccineStatus;
  /** Tamanho compacto (lista) ou normal (detalhe). */
  compact?: boolean;
};

/** Status -> chave i18n do label (cor/icone vem do getStatusVisuals). */
const STATUS_LABEL_KEY = {
  [VaccineStatus.APPLIED]: 'vaccines.statusApplied',
  [VaccineStatus.OVERDUE]: 'vaccines.statusOverdue',
  [VaccineStatus.DUE]: 'vaccines.statusDue',
  [VaccineStatus.UPCOMING]: 'vaccines.statusUpcoming',
} as const;

export function StatusChip({ status, compact }: StatusChipProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
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
        {t(STATUS_LABEL_KEY[status])}
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
