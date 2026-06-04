/**
 * "Hoje" — doses do dia do bebê selecionado, em ordem cronologica.
 *
 * Acoes por dose: Tomei (take) / Pular com motivo opcional (skip) / Desfazer
 * (reset). Mutations invalidam doseLogs e a UI reflete instantaneo (snackbar
 * vem dos proprios hooks).
 *
 * Empty states (mesma logica das outras telas de Saúde):
 *  - 0 bebês na família → orienta cadastrar bebê
 *  - sem bebê selecionado → orienta selecionar no Inicio
 *  - bebê sem doses hoje → estado "tudo certo / nada agendado"
 *
 * Doses são criadas pelo cron do backend a partir dos schedules ativos —
 * esta tela so consome e atualiza status.
 */

import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Dialog,
  Portal,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { MutedText } from '@/shared/components';
import { snackbar } from '@/shared/feedback';
import { useBabies } from '@/features/babies/hooks/useBabies';
import { useBabySelectorStore } from '@/features/babies/store/baby-selector.store';
import type { AppTheme } from '@/app/theme';
import type { MainTabScreenProps } from '@/app/navigation/types';

import { DoseCard } from '../components/DoseCard';
import { DEFAULT_SNOOZE_MINUTES, snoozeDose } from '../alarms';
import { useTodayDoses } from '../hooks/useTodayDoses';
import {
  useResetDose,
  useSkipDose,
  useTakeDose,
} from '../hooks/useDoseActions';
import { DoseStatus, type MedDoseLog } from '../types';

/** Data de hoje localizada conforme o idioma ativo (ex.: "quinta-feira, 04/06"). */
function todayLabel(lng: string): string {
  return new Date().toLocaleDateString(lng, {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
  });
}

export function TodayDosesScreen() {
  const theme = useTheme<AppTheme>();
  const { t, i18n } = useTranslation();
  const navigation =
    useNavigation<MainTabScreenProps<'Today'>['navigation']>();
  const babies = useBabies();
  const selectedBabyId = useBabySelectorStore((s) => s.selectedBabyId);
  const query = useTodayDoses(selectedBabyId);

  const takeMutation = useTakeDose();
  const skipMutation = useSkipDose();
  const resetMutation = useResetDose();

  const [skipTarget, setSkipTarget] = useState<MedDoseLog | null>(null);
  const [skipReason, setSkipReason] = useState('');

  const containerStyle = { backgroundColor: theme.colors.background };

  // Ordena cronologicamente; conta tomadas pro resumo.
  const { doses, takenCount } = useMemo(() => {
    const list = [...(query.data ?? [])].sort((a, b) =>
      a.scheduledFor.localeCompare(b.scheduledFor),
    );
    return {
      doses: list,
      takenCount: list.filter((d) => d.status === DoseStatus.TAKEN).length,
    };
  }, [query.data]);

  const busyId =
    (takeMutation.isPending && takeMutation.variables?.id) ||
    (skipMutation.isPending && skipMutation.variables?.id) ||
    (resetMutation.isPending && resetMutation.variables?.id) ||
    null;

  const confirmSkip = () => {
    if (!skipTarget || !selectedBabyId) return;
    const reason = skipReason.trim();
    skipMutation.mutate({
      babyId: selectedBabyId,
      id: skipTarget.id,
      body: reason ? { reason } : {},
    });
    setSkipTarget(null);
    setSkipReason('');
  };

  // ===== 0 bebês na família
  if (babies.data && babies.data.length === 0) {
    return (
      <SafeAreaView style={[styles.center, containerStyle]} edges={['top']}>
        <MaterialCommunityIcons
          name="baby-face-outline"
          size={80}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          {t('today.noBabyTitle')}
        </Text>
        <MutedText variant="bodyMedium" style={styles.emptyBody}>
          {t('today.noBabyBody')}
        </MutedText>
      </SafeAreaView>
    );
  }

  // ===== sem bebê selecionado
  if (!selectedBabyId) {
    return (
      <SafeAreaView style={[styles.center, containerStyle]} edges={['top']}>
        <MaterialCommunityIcons
          name="account-question-outline"
          size={80}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          {t('today.whichBabyTitle')}
        </Text>
        <MutedText variant="bodyMedium" style={styles.emptyBody}>
          {t('today.whichBabyBody')}
        </MutedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, containerStyle]} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          {t('today.title')}
        </Text>
        <MutedText variant="bodyMedium" style={styles.subtitle}>
          {todayLabel(i18n.language)}
          {doses.length > 0 &&
            ` • ${t('today.summaryTaken', {
              taken: takenCount,
              total: doses.length,
            })}`}
        </MutedText>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching}
            onRefresh={() => query.refetch()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {query.isPending ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator />
          </View>
        ) : query.isError ? (
          <View style={styles.loadingBox}>
            <Text>{t('today.loadError')}</Text>
            <Button onPress={() => query.refetch()}>{t('common.retry')}</Button>
          </View>
        ) : doses.length === 0 ? (
          <View style={styles.emptyListBox}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={56}
              color={theme.app.success}
            />
            <Text variant="titleMedium" style={styles.emptyListTitle}>
              {t('today.nothingTitle')}
            </Text>
            <MutedText variant="bodyMedium" style={styles.emptyListText}>
              {t('today.nothingBody')}
            </MutedText>
          </View>
        ) : (
          doses.map((dose) => (
            <DoseCard
              key={dose.id}
              dose={dose}
              busy={busyId === dose.id}
              onTake={() =>
                takeMutation.mutate({ babyId: selectedBabyId, id: dose.id })
              }
              onSkip={() => {
                setSkipReason('');
                setSkipTarget(dose);
              }}
              onReset={() =>
                resetMutation.mutate({ babyId: selectedBabyId, id: dose.id })
              }
              onSnooze={() => {
                snoozeDose(dose, DEFAULT_SNOOZE_MINUTES)
                  .then(() =>
                    snackbar.show(
                      t('today.snoozeOk', { min: DEFAULT_SNOOZE_MINUTES }),
                      { variant: 'info' },
                    ),
                  )
                  .catch(() => snackbar.showError(t('today.snoozeError')));
              }}
              onPress={() =>
                navigation.navigate('MedicationDetail', {
                  babyId: selectedBabyId,
                  medicationId: dose.medication.id,
                })
              }
            />
          ))
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={skipTarget !== null}
          onDismiss={() => setSkipTarget(null)}
        >
          <Dialog.Title>{t('today.skipTitle')}</Dialog.Title>
          <Dialog.Content>
            <MutedText variant="bodyMedium" style={styles.dialogBody}>
              {t('today.skipBody', { name: skipTarget?.medication.name ?? '' })}
            </MutedText>
            <TextInput
              mode="outlined"
              label={t('today.skipReasonLabel')}
              value={skipReason}
              onChangeText={setSkipReason}
              maxLength={200}
              placeholder={t('today.skipReasonPlaceholder')}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSkipTarget(null)}>
              {t('common.cancel')}
            </Button>
            <Button onPress={confirmSkip}>{t('today.skipTitle')}</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontWeight: '700',
  },
  subtitle: {
    marginTop: 2,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyBody: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyListBox: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 8,
  },
  emptyListTitle: {
    fontWeight: '700',
    marginTop: 8,
  },
  emptyListText: {
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  dialogBody: {
    marginBottom: 16,
  },
});
