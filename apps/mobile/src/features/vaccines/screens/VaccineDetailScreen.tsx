/**
 * Detalhe de uma vacina específica para o bebê selecionado.
 *
 * Mostra:
 *  - Info da vacina (nome, descrição, dose label, intervalo recomendado)
 *  - Status atual + chip
 *  - Se aplicada: dados do registro (data, lote, local, notas) + botões
 *    "Editar" e "Apagar"
 *  - Se não aplicada: botão "Marcar como aplicada"
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Snackbar,
  Text,
  useTheme,
} from 'react-native-paper';

import { ApiError } from '@/shared/api/types';
import type { AppTheme } from '@/app/theme';
import type { AppScreenProps } from '@/app/navigation/types';

import { RegisterVaccineSheet } from '../components/RegisterVaccineSheet';
import { StatusChip } from '../components/StatusChip';
import { useBabyVaccineSchedule } from '../hooks/useBabyVaccineSchedule';
import { useDeleteVaccineRecord } from '../hooks/useDeleteVaccineRecord';
import { useVaccineRecords } from '../hooks/useVaccineRecords';
import { VaccineStatus } from '../types';

function formatDate(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

export function VaccineDetailScreen({
  route,
  navigation,
}: AppScreenProps<'VaccineDetail'>) {
  const { babyId, vaccineId } = route.params;
  const theme = useTheme<AppTheme>();
  const { t } = useTranslation();

  /** "ao nascer" quando 0 mês, senão "{n} mês(es)". */
  const ageLabel = (months: number) =>
    months === 0
      ? t('vaccines.atBirth')
      : t('home.ageMonths', { count: months });

  const schedule = useBabyVaccineSchedule(babyId);
  const records = useVaccineRecords(babyId);
  const deleteRecord = useDeleteVaccineRecord();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  // Encontra a entry no schedule (info + status atual)
  const entry = useMemo(
    () => schedule.data?.entries.find((e) => e.vaccine.id === vaccineId),
    [schedule.data, vaccineId],
  );

  // Encontra o record persistido (se houver) — pra ter lote/local/notas
  const record = useMemo(
    () =>
      entry?.recordId
        ? records.data?.find((r) => r.id === entry.recordId)
        : undefined,
    [entry, records.data],
  );

  const containerStyle = { backgroundColor: theme.colors.background };

  if (schedule.isPending) {
    return (
      <View style={[styles.center, containerStyle]}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (schedule.isError || !entry) {
    return (
      <View style={[styles.center, containerStyle]}>
        <Text variant="bodyLarge">{t('vaccines.detailNotFound')}</Text>
        <Text variant="bodyMedium" style={styles.muted}>
          {t('vaccines.detailNotFoundHint')}
        </Text>
      </View>
    );
  }

  const { vaccine, status } = entry;

  const handleDelete = () => {
    if (!record) return;
    Alert.alert(
      t('vaccines.deleteRecordTitle'),
      t('vaccines.deleteRecordBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('vaccines.deleteAction'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteRecord.mutateAsync({ babyId, id: record.id });
              navigation.goBack();
            } catch (err) {
              setSnackbar(
                err instanceof ApiError
                  ? err.message
                  : t('vaccines.deleteRecordError'),
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.root, containerStyle]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.name}>
            {vaccine.name}
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            {vaccine.doseLabel}
            {vaccine.isBooster ? ` • ${t('vaccines.booster')}` : ''}
          </Text>
          <View style={styles.chipRow}>
            <StatusChip status={status} />
          </View>
        </View>

        {/* INFO */}
        <Card style={styles.card} mode="outlined">
          <Card.Title title={t('vaccines.aboutTitle')} />
          <Card.Content style={styles.cardContent}>
            {vaccine.description && (
              <Text variant="bodyMedium" style={styles.bodyText}>
                {vaccine.description}
              </Text>
            )}
            <Text variant="bodyMedium" style={styles.bodyText}>
              {t('vaccines.recommendedAge', {
                age: ageLabel(vaccine.recommendedAgeMonths),
              })}
            </Text>
            <Text variant="bodyMedium" style={styles.bodyText}>
              {t('vaccines.minAge', { age: ageLabel(vaccine.minAgeMonths) })}
            </Text>
            {vaccine.maxAgeMonths !== null && (
              <Text variant="bodyMedium" style={styles.bodyText}>
                {t('vaccines.maxAge', {
                  age: t('home.ageMonths', { count: vaccine.maxAgeMonths }),
                })}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* APLICACAO REGISTRADA (se houver) */}
        {status === VaccineStatus.APPLIED && record && (
          <Card style={styles.card} mode="outlined">
            <Card.Title title={t('vaccines.recordTitle')} />
            <Card.Content style={styles.cardContent}>
              <Text variant="bodyMedium" style={styles.bodyText}>
                {t('vaccines.recordDate', { date: formatDate(record.appliedAt) })}
              </Text>
              {record.lotNumber && (
                <Text variant="bodyMedium" style={styles.bodyText}>
                  {t('vaccines.recordLot', { value: record.lotNumber })}
                </Text>
              )}
              {record.location && (
                <Text variant="bodyMedium" style={styles.bodyText}>
                  {t('vaccines.recordLocation', { value: record.location })}
                </Text>
              )}
              {record.notes && (
                <Text variant="bodyMedium" style={styles.bodyText}>
                  {t('vaccines.recordNotes', { value: record.notes })}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* ACOES */}
        {status === VaccineStatus.APPLIED && record ? (
          <Button
            mode="text"
            textColor={theme.colors.error}
            icon="trash-can-outline"
            onPress={handleDelete}
            loading={deleteRecord.isPending}
            style={styles.action}
          >
            {t('vaccines.deleteRecordBtn')}
          </Button>
        ) : (
          <Button
            mode="contained"
            icon="check"
            onPress={() => setSheetOpen(true)}
            style={styles.action}
          >
            {t('vaccines.markAppliedFull')}
          </Button>
        )}
      </ScrollView>

      <RegisterVaccineSheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
        babyId={babyId}
        vaccine={vaccine}
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
  name: {
    fontWeight: '700',
  },
  muted: {
    opacity: 0.7,
    marginTop: 4,
  },
  chipRow: {
    marginTop: 12,
  },
  card: {
    marginBottom: 12,
  },
  cardContent: {
    gap: 4,
  },
  bodyText: {
    paddingVertical: 2,
  },
  action: {
    marginTop: 16,
  },
});
