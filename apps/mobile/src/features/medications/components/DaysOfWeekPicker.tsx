/**
 * Picker dos dias da semana — 7 chips toggle (Dom Seg Ter Qua Qui Sex Sab).
 *
 * Estado interno: array de DayKey. Conversao pro bitmask do backend acontece
 * fora (via maskFromDays no submit).
 *
 * Atalhos:
 *  - Botao "Todos os dias" (127)
 *  - Botao "Dias uteis" (62, seg-sex)
 *  - Botao "Fim de semana" (65, dom+sab)
 */

import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Chip, Text, useTheme } from 'react-native-paper';

import type { AppTheme } from '@/app/theme';
import { MutedText } from '@/shared/components';

import {
  ALL_DAYS_MASK,
  DAY_BITMASKS,
  DAY_KEYS,
  WEEKDAYS_MASK,
  WEEKEND_MASK,
  type DayKey,
} from '../types';

type DaysOfWeekPickerProps = {
  value: DayKey[];
  onChange: (days: DayKey[]) => void;
  /** Mensagem de erro (vinda de validacao zod). */
  error?: string;
};

const ALL_KEYS = Object.keys(DAY_BITMASKS) as DayKey[];

export function DaysOfWeekPicker({
  value,
  onChange,
  error,
}: DaysOfWeekPickerProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  const toggle = (day: DayKey) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  const setMask = (mask: number) => {
    const next = ALL_KEYS.filter(
      // eslint-disable-next-line no-bitwise -- bitmask intencional
      (k) => (mask & DAY_BITMASKS[k]) !== 0,
    );
    onChange(next);
  };

  return (
    <View style={styles.container}>
      <Text variant="labelMedium" style={styles.label}>
        {t('daysPicker.label')}
      </Text>

      <View style={styles.shortcuts}>
        <Button
          compact
          mode="text"
          onPress={() => setMask(ALL_DAYS_MASK)}
        >
          {t('daysPicker.all')}
        </Button>
        <Button
          compact
          mode="text"
          onPress={() => setMask(WEEKDAYS_MASK)}
        >
          {t('daysPicker.weekdays')}
        </Button>
        <Button
          compact
          mode="text"
          onPress={() => setMask(WEEKEND_MASK)}
        >
          {t('daysPicker.weekend')}
        </Button>
      </View>

      <View style={styles.chipsRow}>
        {ALL_KEYS.map((key) => {
          const selected = value.includes(key);
          return (
            <Chip
              key={key}
              selected={selected}
              onPress={() => toggle(key)}
              compact
              style={styles.chip}
            >
              {t(DAY_KEYS[key])}
            </Chip>
          );
        })}
      </View>

      {error ? (
        <Text
          variant="bodySmall"
          style={[styles.errorText, { color: theme.colors.error }]}
        >
          {error}
        </Text>
      ) : (
        <MutedText variant="bodySmall" style={styles.helperText}>
          {t('daysPicker.helper')}
        </MutedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  label: {
    opacity: 0.7,
    marginBottom: 4,
  },
  shortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    minWidth: 48,
  },
  errorText: {
    marginTop: 4,
  },
  helperText: {
    marginTop: 4,
  },
});
