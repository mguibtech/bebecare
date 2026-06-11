/**
 * Bottom sheet pra criar/editar um schedule.
 *
 * Componentes:
 *  - TimeField (HH:mm)
 *  - DaysOfWeekPicker (chips toggle)
 *  - Switch useAlarm (alarme local vs push)
 *
 * onConfirm dispara create OU update dependendo se `schedule` foi passado.
 * Componente NAO conhece babyId/medicationId — quem usa fornece os handlers.
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  Modal,
  Portal,
  Snackbar,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';

import type { AppTheme } from '@/app/theme';

import { DaysOfWeekPicker } from './DaysOfWeekPicker';
import { TimeField } from './TimeField';
import { promptAlarmPermissions } from '../alarms';
import {
  daysFromMask,
  maskFromDays,
  type DayKey,
  type MedSchedule,
} from '../types';

export type ScheduleEditorSheetProps = {
  visible: boolean;
  onDismiss: () => void;
  /** Se passado, modo edit; senao, modo create. */
  schedule?: MedSchedule;
  /** Recebe { time, daysOfWeekMask, useAlarm }. */
  onConfirm: (data: {
    time: string;
    daysOfWeekMask: number;
    useAlarm: boolean;
  }) => Promise<void> | void;
  loading?: boolean;
};

export function ScheduleEditorSheet({
  visible,
  onDismiss,
  schedule,
  onConfirm,
  loading,
}: ScheduleEditorSheetProps) {
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const isEdit = Boolean(schedule);

  const [time, setTime] = useState(schedule?.time ?? '08:00');
  const [days, setDays] = useState<DayKey[]>(
    schedule ? daysFromMask(schedule.daysOfWeekMask) : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  );
  const [useAlarm, setUseAlarm] = useState(schedule?.useAlarm ?? true);
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState<string | null>(null);

  // Reset quando o sheet abrir com outro schedule (ou modo)
  useEffect(() => {
    if (visible) {
      setTime(schedule?.time ?? '08:00');
      setDays(
        schedule
          ? daysFromMask(schedule.daysOfWeekMask)
          : ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      );
      setUseAlarm(schedule?.useAlarm ?? true);
      setError(null);
    }
  }, [visible, schedule]);

  const handleConfirm = async () => {
    if (days.length === 0) {
      setError(t('daysPicker.errorNoDay'));
      return;
    }
    setError(null);
    try {
      await onConfirm({
        time,
        daysOfWeekMask: maskFromDays(days),
        useAlarm,
      });
      onDismiss();
      // Just-in-time: so quando o usuário ativou o alarme local. Pede
      // notificação/exact-alarm e orienta tela cheia. Roda apos fechar o sheet.
      if (useAlarm) {
        promptAlarmPermissions();
      }
    } catch (err) {
      setSnack(err instanceof Error ? err.message : t('common.unexpectedError'));
    }
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        contentContainerStyle={[
          styles.sheet,
          { backgroundColor: theme.colors.surface },
        ]}
      >
        <View style={styles.handle} />
        <Text variant="titleMedium" style={styles.title}>
          {isEdit ? t('meds.editSchedule') : t('meds.addSchedule')}
        </Text>

        <View style={styles.field}>
          <TimeField value={time} onChange={setTime} />
        </View>

        <DaysOfWeekPicker
          value={days}
          onChange={setDays}
          error={error ?? undefined}
        />

        <View style={styles.alarmRow}>
          <View style={styles.alarmText}>
            <Text variant="bodyMedium">{t('meds.alarmLocal')}</Text>
            <Text variant="bodySmall" style={styles.alarmHint}>
              {t('meds.alarmLocalHint')}
            </Text>
          </View>
          <Switch value={useAlarm} onValueChange={setUseAlarm} />
        </View>

        <View style={styles.actions}>
          <Button onPress={onDismiss}>{t('common.cancel')}</Button>
          <Button
            mode="contained"
            onPress={handleConfirm}
            loading={loading}
          >
            {isEdit ? t('common.save') : t('meds.add')}
          </Button>
        </View>
      </Modal>

      <Snackbar
        visible={snack !== null}
        onDismiss={() => setSnack(null)}
        duration={3500}
      >
        {snack ?? ''}
      </Snackbar>
    </Portal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    marginHorizontal: 16,
    marginVertical: 24,
    padding: 16,
    borderRadius: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CCC',
    marginBottom: 12,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  field: {
    marginBottom: 12,
  },
  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  alarmText: {
    flex: 1,
  },
  alarmHint: {
    opacity: 0.7,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
});
