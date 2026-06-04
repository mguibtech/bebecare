/**
 * Tab Vacinas — calendário PNI do bebê selecionado, agrupado por idade.
 *
 * Estados:
 *  - 0 bebês na família → empty state com CTA "Cadastrar bebê"
 *  - 0 bebê selecionado → CTA pra selecionar
 *  - Schedule carregando → spinner
 *  - Schedule pronto → SectionList agrupada por idade
 *
 * Tap no card → VaccineDetailScreen (info + registro).
 * Botão "✓" no card pendente → RegisterVaccineSheet (registro rápido).
 *
 * Pull-to-refresh força refetch do schedule (status pode ter mudado com
 * a passagem do tempo).
 */

import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { useBabies } from '@/features/babies/hooks/useBabies';
import { useBabySelectorStore } from '@/features/babies/store/baby-selector.store';
import type { AppTheme } from '@/app/theme';
import type { MainTabScreenProps } from '@/app/navigation/types';

import { AgeGroupSection } from '../components/AgeGroupSection';
import { RegisterVaccineSheet } from '../components/RegisterVaccineSheet';
import { VaccineEntryCard } from '../components/VaccineEntryCard';
import { useBabyVaccineSchedule } from '../hooks/useBabyVaccineSchedule';
import { groupByAge } from '../utils/groupByAge';
import { VaccineStatus, type Vaccine } from '../types';

export function VaccinesScreen() {
  const navigation =
    useNavigation<MainTabScreenProps<'Vaccines'>['navigation']>();
  const theme = useTheme<AppTheme>();
  const babies = useBabies();
  const selectedBabyId = useBabySelectorStore((s) => s.selectedBabyId);
  const schedule = useBabyVaccineSchedule(selectedBabyId);

  const [sheetVaccine, setSheetVaccine] = useState<Vaccine | null>(null);

  const containerStyle = { backgroundColor: theme.colors.background };

  const groups = useMemo(
    () => (schedule.data ? groupByAge(schedule.data.entries) : []),
    [schedule.data],
  );

  // ===== 0 bebês na família
  if (babies.data && babies.data.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={[styles.center, containerStyle]}>
        <MaterialCommunityIcons
          name="baby-face-outline"
          size={80}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Hora de começar!
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.emptyBody, { color: theme.app.text.muted }]}
        >
          O calendário de vacinas é personalizado pela idade do seu bebê.{'\n'}
          Cadastre o primeiro bebê pra ver o PNI completo aqui.
        </Text>
        <Button
          mode="contained"
          icon="plus"
          onPress={() => navigation.navigate('BabyForm', undefined)}
          style={styles.emptyCta}
        >
          Cadastrar bebê
        </Button>
      </SafeAreaView>
    );
  }

  // ===== Sem bebê selecionado
  if (!selectedBabyId) {
    return (
      <SafeAreaView edges={['top']} style={[styles.center, containerStyle]}>
        <MaterialCommunityIcons
          name="account-question-outline"
          size={80}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Qual bebê?
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.emptyBody, { color: theme.app.text.muted }]}
        >
          Você tem mais de um bebê na família. Volte pra Início e escolha
          quem você quer ver as vacinas.
        </Text>
        <Button
          mode="outlined"
          icon="arrow-left"
          onPress={() => navigation.navigate('Home')}
          style={styles.emptyCta}
        >
          Ir pra Início
        </Button>
      </SafeAreaView>
    );
  }

  // ===== Loading inicial
  if (schedule.isPending) {
    return (
      <SafeAreaView edges={['top']} style={[styles.center, containerStyle]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  // ===== Erro
  if (schedule.isError || !schedule.data) {
    return (
      <SafeAreaView edges={['top']} style={[styles.center, containerStyle]}>
        <Text variant="bodyLarge">Erro ao carregar o calendário</Text>
        <Text variant="bodyMedium" style={styles.errorBody}>
          {schedule.error?.message ?? 'Tente puxar pra atualizar.'}
        </Text>
        <Button mode="outlined" onPress={() => schedule.refetch()}>
          Tentar de novo
        </Button>
      </SafeAreaView>
    );
  }

  // ===== Conteudo
  const data = schedule.data;
  const overdueCount = data.summary[VaccineStatus.OVERDUE] ?? 0;
  const dueCount = data.summary[VaccineStatus.DUE] ?? 0;
  const appliedCount = data.summary[VaccineStatus.APPLIED] ?? 0;
  const totalCount = data.entries.length;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, containerStyle]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={schedule.isRefetching}
            onRefresh={() => schedule.refetch()}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* HEADER do bebê + resumo */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={styles.babyName}>
            {data.babyName}
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            {data.babyAgeMonths === 0
              ? 'Recém-nascido'
              : `${data.babyAgeMonths} ${data.babyAgeMonths === 1 ? 'mês' : 'meses'}`}
          </Text>

          <View style={styles.summaryRow}>
            {overdueCount > 0 && (
              <View
                style={[
                  styles.summaryPill,
                  { backgroundColor: theme.colors.error + '24' },
                ]}
              >
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={14}
                  color={theme.colors.error}
                />
                <Text
                  variant="bodySmall"
                  style={[styles.summaryText, { color: theme.colors.error }]}
                >
                  {overdueCount} atrasada{overdueCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {dueCount > 0 && (
              <View
                style={[
                  styles.summaryPill,
                  { backgroundColor: theme.app.warning + '24' },
                ]}
              >
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={14}
                  color={theme.app.warning}
                />
                <Text
                  variant="bodySmall"
                  style={[styles.summaryText, { color: theme.app.warning }]}
                >
                  {dueCount} no prazo
                </Text>
              </View>
            )}
            <View
              style={[
                styles.summaryPill,
                { backgroundColor: theme.app.success + '24' },
              ]}
            >
              <MaterialCommunityIcons
                name="check-circle"
                size={14}
                color={theme.app.success}
              />
              <Text
                variant="bodySmall"
                style={[styles.summaryText, { color: theme.app.success }]}
              >
                {appliedCount} de {totalCount} aplicadas
              </Text>
            </View>
          </View>
        </View>

        {/* GRUPOS POR IDADE */}
        {groups.map((group) => (
          <View key={group.ageMonths}>
            <AgeGroupSection group={group} />
            {group.entries.map((entry) => (
              <VaccineEntryCard
                key={entry.vaccine.id}
                entry={entry}
                onPress={() =>
                  navigation.navigate('VaccineDetail', {
                    babyId: selectedBabyId,
                    vaccineId: entry.vaccine.id,
                  })
                }
                onMarkApplied={
                  entry.status === VaccineStatus.APPLIED
                    ? undefined
                    : () => setSheetVaccine(entry.vaccine)
                }
              />
            ))}
          </View>
        ))}
      </ScrollView>

      <RegisterVaccineSheet
        visible={sheetVaccine !== null}
        onDismiss={() => setSheetVaccine(null)}
        babyId={selectedBabyId}
        vaccine={sheetVaccine}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 48 },
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
  emptyCta: {
    marginTop: 24,
    minWidth: 200,
  },
  errorBody: {
    opacity: 0.7,
    textAlign: 'center',
    marginVertical: 8,
  },
  header: {
    marginBottom: 8,
  },
  babyName: {
    fontWeight: '700',
  },
  muted: {
    opacity: 0.7,
  },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  summaryText: {
    fontWeight: '600',
  },
});
