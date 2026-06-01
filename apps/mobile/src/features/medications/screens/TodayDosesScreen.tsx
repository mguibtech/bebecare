/**
 * "Hoje" — doses do dia do bebe selecionado, em ordem cronologica.
 *
 * Acoes por dose: Tomei (take) / Pular com motivo opcional (skip) / Desfazer
 * (reset). Mutations invalidam doseLogs e a UI reflete instantaneo (snackbar
 * vem dos proprios hooks).
 *
 * Empty states (mesma logica das outras telas de Saude):
 *  - 0 bebes na familia → orienta cadastrar bebe
 *  - sem bebe selecionado → orienta selecionar no Inicio
 *  - bebe sem doses hoje → estado "tudo certo / nada agendado"
 *
 * Doses sao criadas pelo cron do backend a partir dos schedules ativos —
 * esta tela so consome e atualiza status.
 */

import { useMemo, useState } from 'react';
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
import { useBabies } from '@/features/babies/hooks/useBabies';
import { useBabySelectorStore } from '@/features/babies/store/baby-selector.store';
import type { AppTheme } from '@/app/theme';
import type { MainTabScreenProps } from '@/app/navigation/types';

import { DoseCard } from '../components/DoseCard';
import { useTodayDoses } from '../hooks/useTodayDoses';
import {
  useResetDose,
  useSkipDose,
  useTakeDose,
} from '../hooks/useDoseActions';
import { DoseStatus, type MedDoseLog } from '../types';

function todayLabel(): string {
  const d = new Date();
  const dias = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
  return `${dias[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}`;
}

export function TodayDosesScreen() {
  const theme = useTheme<AppTheme>();
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

  // ===== 0 bebes na familia
  if (babies.data && babies.data.length === 0) {
    return (
      <SafeAreaView style={[styles.center, containerStyle]} edges={['top']}>
        <MaterialCommunityIcons
          name="baby-face-outline"
          size={80}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Cadastre um bebê primeiro
        </Text>
        <MutedText variant="bodyMedium" style={styles.emptyBody}>
          As doses do dia aparecem aqui depois que você{'\n'}
          cadastrar um bebê e os remédios dele.
        </MutedText>
      </SafeAreaView>
    );
  }

  // ===== sem bebe selecionado
  if (!selectedBabyId) {
    return (
      <SafeAreaView style={[styles.center, containerStyle]} edges={['top']}>
        <MaterialCommunityIcons
          name="account-question-outline"
          size={80}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Qual bebê?
        </Text>
        <MutedText variant="bodyMedium" style={styles.emptyBody}>
          Selecione um bebê na tab Início pra ver as doses dele.
        </MutedText>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.root, containerStyle]} edges={['top']}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Hoje
        </Text>
        <MutedText variant="bodyMedium" style={styles.subtitle}>
          {todayLabel()}
          {doses.length > 0 && ` • ${takenCount}/${doses.length} tomadas`}
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
            <Text>Erro ao carregar as doses</Text>
            <Button onPress={() => query.refetch()}>Tentar de novo</Button>
          </View>
        ) : doses.length === 0 ? (
          <View style={styles.emptyListBox}>
            <MaterialCommunityIcons
              name="calendar-check"
              size={56}
              color={theme.app.success}
            />
            <Text variant="titleMedium" style={styles.emptyListTitle}>
              Nada para hoje
            </Text>
            <MutedText variant="bodyMedium" style={styles.emptyListText}>
              Nenhuma dose agendada para hoje.{'\n'}
              Cadastre horários em Saúde → Remédios.
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
          <Dialog.Title>Pular dose</Dialog.Title>
          <Dialog.Content>
            <MutedText variant="bodyMedium" style={styles.dialogBody}>
              {skipTarget?.medication.name} — pode registrar o motivo
              (opcional).
            </MutedText>
            <TextInput
              mode="outlined"
              label="Motivo (opcional)"
              value={skipReason}
              onChangeText={setSkipReason}
              maxLength={200}
              placeholder="ex: bebê dormindo, recusou"
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setSkipTarget(null)}>Cancelar</Button>
            <Button onPress={confirmSkip}>Pular dose</Button>
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
