/**
 * Form de criar/editar um despertador.
 *
 * Campos: label, categoria (chips), horário, dias da semana, ativo.
 * Reusa TimeField/DaysOfWeekPicker do M6 e promptAlarmPermissions (pede
 * notificação/alarme-exato ao ativar). Em modo edit, botao de excluir.
 */

import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Chip,
  Switch,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { MutedText } from '@/shared/components';
import { snackbar } from '@/shared/feedback';
import type { AppTheme } from '@/app/theme';
import type { AppScreenProps } from '@/app/navigation/types';

import { DaysOfWeekPicker } from '@/features/medications/components/DaysOfWeekPicker';
import { TimeField } from '@/features/medications/components/TimeField';
import { promptAlarmPermissions } from '@/features/medications/alarms';

import { useAlarms } from '../hooks/useAlarms';
import {
  useCreateAlarm,
  useDeleteAlarm,
  useUpdateAlarm,
} from '../hooks/useAlarmMutations';
import {
  ALARM_CATEGORY_LABELS,
  ALL_DAYS_MASK,
  AlarmCategory,
  INTERVAL_OPTIONS,
  daysFromMask,
  maskFromDays,
  type DayKey,
} from '../types';

const CATEGORIES = [
  AlarmCategory.FEEDING,
  AlarmCategory.DIAPER,
  AlarmCategory.NAP,
  AlarmCategory.CUSTOM,
];

export function AlarmFormScreen({
  route,
  navigation,
}: AppScreenProps<'AlarmForm'>) {
  const alarmId = route.params?.alarmId;
  const isEdit = typeof alarmId === 'string';
  const theme = useTheme<AppTheme>();

  const alarms = useAlarms();
  const editing = isEdit
    ? alarms.data?.find((a) => a.id === alarmId)
    : undefined;

  const create = useCreateAlarm();
  const update = useUpdateAlarm();
  const remove = useDeleteAlarm();

  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<AlarmCategory>(AlarmCategory.FEEDING);
  const [time, setTime] = useState('06:00');
  // null = horário unico; número = a cada N horas.
  const [intervalHours, setIntervalHours] = useState<number | null>(null);
  const [days, setDays] = useState<DayKey[]>(daysFromMask(ALL_DAYS_MASK));
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Hidrata em modo edit.
  useEffect(() => {
    if (editing) {
      setLabel(editing.label);
      setCategory(editing.category);
      setTime(editing.time);
      setIntervalHours(editing.intervalHours);
      setDays(daysFromMask(editing.daysOfWeekMask));
      setIsActive(editing.isActive);
    }
  }, [editing]);

  useEffect(() => {
    navigation.setOptions({
      title: isEdit ? 'Editar despertador' : 'Novo despertador',
    });
  }, [navigation, isEdit]);

  const saving = create.isPending || update.isPending;

  const onSave = async () => {
    if (label.trim().length === 0) {
      setError('Dê um nome ao despertador');
      return;
    }
    if (days.length === 0) {
      setError('Selecione pelo menos um dia');
      return;
    }
    setError(null);

    const body = {
      label: label.trim(),
      time,
      daysOfWeekMask: maskFromDays(days),
      category,
      intervalHours,
      isActive,
    };

    try {
      if (isEdit) {
        await update.mutateAsync({ id: alarmId!, body });
      } else {
        await create.mutateAsync(body);
      }
      // Pede permissões do alarme (notificação/exato/tela cheia) ao salvar ativo.
      if (isActive) {
        promptAlarmPermissions();
      }
      navigation.goBack();
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    }
  };

  const onDelete = async () => {
    if (!alarmId) return;
    try {
      await remove.mutateAsync(alarmId);
      navigation.goBack();
    } catch {
      snackbar.showError('Erro ao excluir');
    }
  };

  if (isEdit && alarms.isPending) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          mode="outlined"
          label="Nome"
          placeholder="ex: Mamada da manhã"
          value={label}
          onChangeText={setLabel}
          maxLength={80}
          error={Boolean(error) && label.trim().length === 0}
        />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Categoria
        </Text>
        <View style={styles.chips}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              selected={category === c}
              showSelectedCheck
              onPress={() => setCategory(c)}
              style={styles.chip}
            >
              {ALARM_CATEGORY_LABELS[c]}
            </Chip>
          ))}
        </View>

        <Text variant="titleSmall" style={styles.sectionTitle}>
          {intervalHours ? 'A partir de' : 'Horário'}
        </Text>
        <TimeField value={time} onChange={setTime} />

        <Text variant="titleSmall" style={styles.sectionTitle}>
          Repetir
        </Text>
        <View style={styles.chips}>
          <Chip
            selected={intervalHours === null}
            showSelectedCheck
            onPress={() => setIntervalHours(null)}
            style={styles.chip}
          >
            Horário único
          </Chip>
          {INTERVAL_OPTIONS.map((h) => (
            <Chip
              key={h}
              selected={intervalHours === h}
              showSelectedCheck
              onPress={() => setIntervalHours(h)}
              style={styles.chip}
            >
              A cada {h}h
            </Chip>
          ))}
        </View>
        {intervalHours && (
          <MutedText variant="bodySmall" style={styles.intervalHint}>
            Toca de {intervalHours} em {intervalHours} horas a partir de {time},
            dia e noite ({24 / intervalHours}x ao dia).
          </MutedText>
        )}

        <DaysOfWeekPicker
          value={days}
          onChange={setDays}
          error={
            error && days.length === 0 ? 'Selecione pelo menos um dia' : undefined
          }
        />

        <View style={styles.switchRow}>
          <View style={styles.switchText}>
            <Text variant="bodyMedium">Ativo</Text>
            <MutedText variant="bodySmall">
              Desligue pra pausar sem excluir.
            </MutedText>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        {error && label.trim().length > 0 && days.length > 0 && (
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {error}
          </Text>
        )}

        <Button
          mode="contained"
          onPress={onSave}
          loading={saving}
          disabled={saving}
          style={styles.saveBtn}
        >
          {isEdit ? 'Salvar' : 'Criar despertador'}
        </Button>

        {isEdit && (
          <Button
            mode="text"
            textColor={theme.colors.error}
            onPress={onDelete}
            loading={remove.isPending}
            disabled={remove.isPending}
            style={styles.deleteBtn}
          >
            Excluir despertador
          </Button>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
    fontWeight: '700',
    opacity: 0.8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  intervalHint: {
    marginTop: 8,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
    gap: 16,
  },
  switchText: { flex: 1 },
  errorText: {
    marginTop: 4,
  },
  saveBtn: {
    marginTop: 24,
  },
  deleteBtn: {
    marginTop: 8,
  },
});
