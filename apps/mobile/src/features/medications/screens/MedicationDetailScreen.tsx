/**
 * Detalhe de medicamento — info + schedules + acoes.
 *
 * Schedules são mostrados como lista compacta com:
 *  - Hora + dias da semana
 *  - Toggle de useAlarm (alarme local vs push)
 *  - Botao remover (com confirmacao)
 *
 * Header tem Editar (lapis) que navega pra Form em modo edit.
 * Rodape tem Apagar medicamento (zona perigosa).
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Card,
  IconButton,
  Snackbar,
  Switch,
  Text,
  useTheme,
} from 'react-native-paper';

import { ApiError } from '@/shared/api/types';
import { MutedText } from '@/shared/components';
import type { AppTheme } from '@/app/theme';
import type { AppScreenProps } from '@/app/navigation/types';

import {
  useCreateMedSchedule,
  useDeleteMedSchedule,
  useUpdateMedSchedule,
} from '../hooks';
import { useDeleteMedication } from '../hooks/useDeleteMedication';
import { useMedication } from '../hooks/useMedication';
import { ScheduleEditorSheet } from '../components/ScheduleEditorSheet';
import {
  DOSE_UNIT_LABELS,
  type MedSchedule,
} from '../types';

function formatDate(s: string | null): string {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function daysSummary(schedule: MedSchedule): string {
  // backend já manda nomes formatados em PT-BR
  return schedule.daysOfWeekNames.join(', ');
}

export function MedicationDetailScreen({
  route,
  navigation,
}: AppScreenProps<'MedicationDetail'>) {
  const { babyId, medicationId } = route.params;
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const query = useMedication(babyId, medicationId);
  const deleteMutation = useDeleteMedication();
  const createScheduleMutation = useCreateMedSchedule();
  const updateScheduleMutation = useUpdateMedSchedule();
  const deleteScheduleMutation = useDeleteMedSchedule();

  const [snackbar, setSnackbar] = useState<string | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<MedSchedule | null>(
    null,
  );

  const openAddSchedule = () => {
    setEditingSchedule(null);
    setSheetOpen(true);
  };

  const openEditSchedule = (schedule: MedSchedule) => {
    setEditingSchedule(schedule);
    setSheetOpen(true);
  };

  // Botao Editar no header
  useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components -- headerRight do RN Navigation eh render-prop padrao
      headerRight: () => (
        <Appbar.Action
          icon="pencil"
          accessibilityLabel="Editar"
          onPress={() =>
            navigation.navigate('MedicationForm', {
              babyId,
              medicationId,
            })
          }
        />
      ),
    });
  }, [navigation, babyId, medicationId]);

  if (query.isPending) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (query.isError || !query.data) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text>{t('meds.notFound')}</Text>
      </View>
    );
  }

  const med = query.data;
  const dose = Number(med.dose);

  const handleToggleAlarm = (schedule: MedSchedule) => {
    updateScheduleMutation.mutate({
      babyId,
      medicationId,
      id: schedule.id,
      body: { useAlarm: !schedule.useAlarm },
    });
  };

  const handleToggleScheduleActive = (schedule: MedSchedule) => {
    updateScheduleMutation.mutate({
      babyId,
      medicationId,
      id: schedule.id,
      body: { isActive: !schedule.isActive },
    });
  };

  const handleRemoveSchedule = (schedule: MedSchedule) => {
    Alert.alert(
      t('meds.removeScheduleTitle'),
      t('meds.removeScheduleConfirm', { time: schedule.time }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('meds.remove'),
          style: 'destructive',
          onPress: () =>
            deleteScheduleMutation.mutate({
              babyId,
              medicationId,
              id: schedule.id,
            }),
        },
      ],
    );
  };

  const handleDeleteMedication = () => {
    Alert.alert(
      t('meds.deleteTitle'),
      t('meds.deleteConfirm', { name: med.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('meds.deleteAction'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({
                babyId,
                id: medicationId,
              });
              navigation.goBack();
            } catch (err) {
              setSnackbar(
                err instanceof ApiError ? err.message : t('meds.deleteError'),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View
      style={[styles.root, { backgroundColor: theme.colors.background }]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.name}>
            {med.name}
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {dose} {DOSE_UNIT_LABELS[med.doseUnit]} •{' '}
            {med.isActive ? t('meds.active') : t('meds.paused')}
          </Text>
        </View>

        {/* INFO BÁSICA */}
        <Card mode="outlined" style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="bodyMedium">
              <MutedText>{t('meds.startLabel')}</MutedText>
              {formatDate(med.startDate)}
            </Text>
            <Text variant="bodyMedium">
              <MutedText>{t('meds.endDateLabel')}</MutedText>
              {med.endDate ? formatDate(med.endDate) : t('meds.continuous')}
            </Text>
            {med.instructions && (
              <Text variant="bodyMedium">
                <MutedText>{t('meds.instructionsInline')}</MutedText>
                {med.instructions}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* HORÁRIOS */}
        <Card mode="outlined" style={styles.card}>
          <Card.Title
            title={t('meds.schedules')}
            subtitle={t('meds.schedulesCount', {
              count: med.schedules.length,
            })}
          />
          <Card.Content style={styles.cardContentTight}>
            {med.schedules.length === 0 ? (
              <MutedText variant="bodyMedium" style={styles.noSchedules}>
                {t('meds.noSchedules')}
              </MutedText>
            ) : (
              med.schedules.map((schedule) => (
                <View key={schedule.id} style={styles.scheduleRow}>
                  <View style={styles.scheduleInfo}>
                    <Text variant="titleMedium" style={styles.scheduleTime}>
                      {schedule.time}
                    </Text>
                    <MutedText variant="bodySmall">
                      {daysSummary(schedule)}
                    </MutedText>
                    <View style={styles.alarmRow}>
                      <Text variant="bodySmall">{t('meds.alarmLocal')}</Text>
                      <Switch
                        value={schedule.useAlarm}
                        onValueChange={() => handleToggleAlarm(schedule)}
                      />
                    </View>
                    <View style={styles.alarmRow}>
                      <Text variant="bodySmall">
                        {t('meds.scheduleActive')}
                      </Text>
                      <Switch
                        value={schedule.isActive}
                        onValueChange={() =>
                          handleToggleScheduleActive(schedule)
                        }
                      />
                    </View>
                  </View>
                  <View style={styles.scheduleActions}>
                    <IconButton
                      icon="pencil"
                      accessibilityLabel={t('meds.editSchedule')}
                      onPress={() => openEditSchedule(schedule)}
                    />
                    <IconButton
                      icon="trash-can-outline"
                      iconColor={theme.colors.error}
                      accessibilityLabel={t('meds.removeScheduleTitle')}
                      onPress={() => handleRemoveSchedule(schedule)}
                    />
                  </View>
                </View>
              ))
            )}
            <Button
              mode="text"
              icon="plus"
              onPress={openAddSchedule}
              style={styles.addSchedule}
            >
              {t('meds.addSchedule')}
            </Button>
          </Card.Content>
        </Card>

        {/* APAGAR */}
        <View style={styles.dangerZone}>
          <MutedText
            variant="labelSmall"
            style={styles.dangerLabel}
          >
            {t('meds.dangerZone')}
          </MutedText>
          <Button
            mode="text"
            textColor={theme.colors.error}
            icon="trash-can-outline"
            onPress={handleDeleteMedication}
            loading={deleteMutation.isPending}
          >
            {t('meds.deleteTitle')}
          </Button>
        </View>
      </ScrollView>

      <ScheduleEditorSheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        schedule={editingSchedule ?? undefined}
        loading={
          createScheduleMutation.isPending ||
          updateScheduleMutation.isPending
        }
        onConfirm={async (data) => {
          if (editingSchedule) {
            await updateScheduleMutation.mutateAsync({
              babyId,
              medicationId,
              id: editingSchedule.id,
              body: data,
            });
          } else {
            await createScheduleMutation.mutateAsync({
              babyId,
              medicationId,
              body: data,
            });
          }
        }}
      />

      <Snackbar
        visible={snackbar !== null}
        onDismiss={() => setSnackbar(null)}
        duration={4000}
        action={{ label: t('common.ok'), onPress: () => setSnackbar(null) }}
      >
        {snackbar ?? ''}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 32 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    marginBottom: 16,
  },
  name: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
    opacity: 0.8,
  },
  card: {
    marginBottom: 12,
  },
  cardContent: {
    gap: 6,
  },
  cardContentTight: {
    paddingHorizontal: 0,
  },
  noSchedules: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.2)',
  },
  scheduleInfo: {
    flex: 1,
    gap: 4,
  },
  scheduleActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addSchedule: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginLeft: 8,
  },
  scheduleTime: {
    fontWeight: '700',
  },
  alarmRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  dangerZone: {
    marginTop: 24,
    paddingTop: 16,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.3)',
  },
  dangerLabel: {
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
