/**
 * Detalhe de consulta — info + acoes Completar/Cancelar/Apagar/Editar.
 *
 * SCHEDULED: mostra botoes Completar + Cancelar
 * COMPLETED: mostra dados pos-consulta (notas, data) + botao Apagar
 * CANCELED:  mostra motivo + data cancelamento + Apagar
 * MISSED:    mesma logica do scheduled (ainda da pra Completar/Cancelar)
 */

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Card,
  Dialog,
  Portal,
  Snackbar,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { ApiError } from '@/shared/api/types';
import { MutedText } from '@/shared/components';
import type { AppTheme } from '@/app/theme';
import type { AppScreenProps } from '@/app/navigation/types';

import { StatusChip } from '../components/StatusChip';
import { useAppointment } from '../hooks/useAppointment';
import { useCancelAppointment } from '../hooks/useCancelAppointment';
import { useCompleteAppointment } from '../hooks/useCompleteAppointment';
import { useDeleteAppointment } from '../hooks/useDeleteAppointment';
import { AppointmentStatus } from '../types';

function formatLong(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} às ${hours}:${minutes}`;
}

export function AppointmentDetailScreen({
  route,
  navigation,
}: AppScreenProps<'AppointmentDetail'>) {
  const { babyId, appointmentId } = route.params;
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();
  const query = useAppointment(babyId, appointmentId);
  const completeMutation = useCompleteAppointment();
  const cancelMutation = useCancelAppointment();
  const deleteMutation = useDeleteAppointment();

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeNotes, setCompleteNotes] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [snackbar, setSnackbar] = useState<string | null>(null);

  // Botao Editar no header
  useEffect(() => {
    if (!query.data) return;
    const canEdit = query.data.status === AppointmentStatus.SCHEDULED;
    navigation.setOptions({
      headerRight: canEdit
        ? () => (
            <Appbar.Action
              icon="pencil"
              accessibilityLabel={t('common.edit')}
              onPress={() =>
                navigation.navigate('AppointmentForm', {
                  babyId,
                  appointmentId,
                })
              }
            />
          )
        : undefined,
    });
  }, [navigation, query.data, babyId, appointmentId, t]);

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
        <Text variant="bodyLarge">{t('appointments.notFound')}</Text>
      </View>
    );
  }

  const a = query.data;
  const isScheduled = a.status === AppointmentStatus.SCHEDULED || a.status === AppointmentStatus.MISSED;

  const handleComplete = async () => {
    setCompleteOpen(false);
    try {
      await completeMutation.mutateAsync({
        babyId,
        id: appointmentId,
        body: { notes: completeNotes.trim() || undefined },
      });
      setCompleteNotes('');
    } catch (err) {
      setSnackbar(
        err instanceof ApiError ? err.message : t('appointments.completeError'),
      );
    }
  };

  const handleCancel = async () => {
    setCancelOpen(false);
    try {
      await cancelMutation.mutateAsync({
        babyId,
        id: appointmentId,
        body: { reason: cancelReason.trim() || undefined },
      });
      setCancelReason('');
    } catch (err) {
      setSnackbar(
        err instanceof ApiError ? err.message : t('appointments.cancelError'),
      );
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('appointments.deleteTitle'),
      t('appointments.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('appointments.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync({
                babyId,
                id: appointmentId,
              });
              navigation.goBack();
            } catch (err) {
              setSnackbar(
                err instanceof ApiError ? err.message : t('appointments.deleteError'),
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
          <Text variant="headlineSmall" style={styles.title}>
            {a.title}
          </Text>
          <MutedText variant="bodyMedium" style={styles.subtitle}>
            {formatLong(a.scheduledAt)}
          </MutedText>
          <View style={styles.chipRow}>
            <StatusChip status={a.status} />
          </View>
        </View>

        {/* INFO */}
        <Card mode="outlined" style={styles.card}>
          <Card.Content style={styles.cardContent}>
            {a.doctorName && (
              <Text variant="bodyMedium" style={styles.row}>
                <MutedText>{t('appointments.doctorInline')}</MutedText>
                {a.doctorName}
              </Text>
            )}
            {a.specialty && (
              <Text variant="bodyMedium" style={styles.row}>
                <MutedText>{t('appointments.specialtyInline')}</MutedText>
                {a.specialty}
              </Text>
            )}
            {a.location && (
              <Text variant="bodyMedium" style={styles.row}>
                <MutedText>{t('appointments.locationInline')}</MutedText>
                {a.location}
              </Text>
            )}
            {a.notes && (
              <Text variant="bodyMedium" style={styles.row}>
                <MutedText>{t('appointments.notesInline')}</MutedText>
                {a.notes}
              </Text>
            )}
            <Text variant="bodySmall" style={styles.row}>
              <MutedText>{t('appointments.reminderInline')}</MutedText>
              {a.reminderEnabled
                ? t('appointments.reminderValue', {
                    min: a.reminderMinutesBefore,
                  })
                : t('appointments.reminderOff')}
            </Text>
          </Card.Content>
        </Card>

        {/* PÓS-CONSULTA (se houver) */}
        {a.status === AppointmentStatus.COMPLETED && (
          <Card mode="outlined" style={styles.card}>
            <Card.Title title={t('appointments.postTitle')} />
            <Card.Content style={styles.cardContent}>
              {a.completedAt && (
                <MutedText variant="bodySmall">
                  {t('appointments.doneAt', {
                    date: formatLong(a.completedAt),
                  })}
                </MutedText>
              )}
              {a.completedNotes ? (
                <Text variant="bodyMedium">{a.completedNotes}</Text>
              ) : (
                <MutedText variant="bodyMedium">
                  {t('appointments.noNotes')}
                </MutedText>
              )}
            </Card.Content>
          </Card>
        )}

        {/* CANCELAMENTO (se houver) */}
        {a.status === AppointmentStatus.CANCELED && (
          <Card mode="outlined" style={styles.card}>
            <Card.Title title={t('appointments.cancelSection')} />
            <Card.Content style={styles.cardContent}>
              {a.canceledAt && (
                <MutedText variant="bodySmall">
                  {t('appointments.canceledAt', {
                    date: formatLong(a.canceledAt),
                  })}
                </MutedText>
              )}
              {a.cancelReason ? (
                <Text variant="bodyMedium">{a.cancelReason}</Text>
              ) : (
                <MutedText variant="bodyMedium">
                  {t('appointments.noReason')}
                </MutedText>
              )}
            </Card.Content>
          </Card>
        )}

        {/* AÇÕES */}
        <View style={styles.actions}>
          {isScheduled && (
            <>
              <Button
                mode="contained"
                icon="check"
                onPress={() => setCompleteOpen(true)}
                style={styles.actionBtn}
              >
                {t('appointments.markDone')}
              </Button>
              <Button
                mode="outlined"
                icon="close"
                onPress={() => setCancelOpen(true)}
                style={styles.actionBtn}
              >
                {t('appointments.cancelAppt')}
              </Button>
            </>
          )}
          <Button
            mode="text"
            icon="trash-can-outline"
            textColor={theme.colors.error}
            onPress={handleDelete}
            loading={deleteMutation.isPending}
            style={styles.actionBtn}
          >
            {t('appointments.delete')}
          </Button>
        </View>
      </ScrollView>

      {/* DIALOG: Completar */}
      <Portal>
        <Dialog
          visible={completeOpen}
          onDismiss={() => setCompleteOpen(false)}
        >
          <Dialog.Title>{t('appointments.markDone')}</Dialog.Title>
          <Dialog.Content>
            <MutedText variant="bodyMedium" style={styles.dialogHint}>
              {t('appointments.completeHint')}
            </MutedText>
            <TextInput
              mode="outlined"
              value={completeNotes}
              onChangeText={setCompleteNotes}
              multiline
              numberOfLines={4}
              placeholder={t('appointments.completePlaceholder')}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCompleteOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              onPress={handleComplete}
              loading={completeMutation.isPending}
            >
              {t('common.confirm')}
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* DIALOG: Cancelar */}
        <Dialog visible={cancelOpen} onDismiss={() => setCancelOpen(false)}>
          <Dialog.Title>{t('appointments.cancelAppt')}</Dialog.Title>
          <Dialog.Content>
            <MutedText variant="bodyMedium" style={styles.dialogHint}>
              {t('appointments.cancelHint')}
            </MutedText>
            <TextInput
              mode="outlined"
              value={cancelReason}
              onChangeText={setCancelReason}
              maxLength={200}
              placeholder={t('appointments.cancelPlaceholder')}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCancelOpen(false)}>
              {t('common.back')}
            </Button>
            <Button
              onPress={handleCancel}
              loading={cancelMutation.isPending}
              textColor={theme.colors.error}
            >
              {t('appointments.cancelAppt')}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

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
  scroll: { padding: 16, paddingBottom: 48 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 4,
  },
  chipRow: {
    marginTop: 12,
  },
  card: {
    marginBottom: 12,
  },
  cardContent: {
    gap: 6,
  },
  row: {
    paddingVertical: 2,
  },
  actions: {
    marginTop: 16,
    gap: 8,
  },
  actionBtn: {
    width: '100%',
  },
  dialogHint: {
    marginBottom: 8,
  },
});
