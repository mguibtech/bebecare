/**
 * Lista de consultas do bebê selecionado, agrupada por scope.
 *
 * SegmentedButtons Próximas | Passadas | Canceladas filtra a lista
 * via backend (scope filter).
 *
 * FAB pra criar nova consulta navega pra AppointmentForm.
 * Tap em card → AppointmentDetail.
 *
 * Esta tela eh embarcada dentro de HealthScreen quando o tab "Consultas"
 * esta ativo. Quando tem 0 bebê ou nenhum selecionado, mostra empty state.
 */

import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  FAB,
  SegmentedButtons,
  Text,
  useTheme,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { MutedText } from '@/shared/components';
import { useBabies } from '@/features/babies/hooks/useBabies';
import { useBabySelectorStore } from '@/features/babies/store/baby-selector.store';
import type { AppTheme } from '@/app/theme';
import type { MainTabScreenProps } from '@/app/navigation/types';

import { AppointmentCard } from '../components/AppointmentCard';
import { useAppointments } from '../hooks/useAppointments';
import {
  AppointmentStatus,
  type AppointmentScope,
} from '../types';

type ListScope = 'upcoming' | 'past' | 'canceled';

const SCOPE_TO_FILTER: Record<ListScope, AppointmentScope> = {
  upcoming: 'upcoming',
  past: 'past',
  canceled: 'all', // filtra canceladas manualmente no front
};

export function AppointmentsListScreen() {
  const theme = useTheme<AppTheme>();
  const navigation =
    useNavigation<MainTabScreenProps<'Health'>['navigation']>();
  const babies = useBabies();
  const selectedBabyId = useBabySelectorStore((s) => s.selectedBabyId);

  const [scope, setScope] = useState<ListScope>('upcoming');
  const filterScope = SCOPE_TO_FILTER[scope];
  const query = useAppointments(selectedBabyId, filterScope);

  // Pra scope='canceled', filtra apenas as canceladas no resultado.
  const items = useMemo(() => {
    if (!query.data) return [];
    if (scope === 'canceled') {
      return query.data.filter(
        (a) => a.status === AppointmentStatus.CANCELED,
      );
    }
    return query.data;
  }, [query.data, scope]);

  const containerStyle = { backgroundColor: theme.colors.background };

  // ===== Empty state: sem bebês na família
  if (babies.data && babies.data.length === 0) {
    return (
      <View style={[styles.center, containerStyle]}>
        <MaterialCommunityIcons
          name="baby-face-outline"
          size={80}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Cadastre um bebê primeiro
        </Text>
        <MutedText variant="bodyMedium" style={styles.emptyBody}>
          Consultas são organizadas por bebê.{'\n'}
          Cadastre na tab Início pra começar a marcar agendamentos.
        </MutedText>
      </View>
    );
  }

  // ===== Empty state: sem bebê selecionado
  if (!selectedBabyId) {
    return (
      <View style={[styles.center, containerStyle]}>
        <MaterialCommunityIcons
          name="account-question-outline"
          size={80}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Qual bebê?
        </Text>
        <MutedText variant="bodyMedium" style={styles.emptyBody}>
          Selecione um bebê na tab Início pra ver as consultas dele.
        </MutedText>
      </View>
    );
  }

  return (
    <View style={[styles.root, containerStyle]}>
      <View style={styles.scopeRow}>
        <SegmentedButtons
          value={scope}
          onValueChange={(v) => setScope(v as ListScope)}
          density="small"
          buttons={[
            { value: 'upcoming', label: 'Próximas' },
            { value: 'past', label: 'Passadas' },
            { value: 'canceled', label: 'Canceladas' },
          ]}
        />
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
            <Text>Erro ao carregar consultas</Text>
            <Button onPress={() => query.refetch()}>Tentar de novo</Button>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.emptyListBox}>
            <MaterialCommunityIcons
              name="calendar-blank"
              size={48}
              color={theme.app.text.muted}
            />
            <MutedText variant="bodyMedium" style={styles.emptyListText}>
              {scope === 'upcoming'
                ? 'Nenhuma consulta agendada. Use o + pra marcar a primeira.'
                : scope === 'past'
                  ? 'Sem consultas realizadas ainda.'
                  : 'Nenhuma consulta cancelada.'}
            </MutedText>
          </View>
        ) : (
          items.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onPress={() =>
                navigation.navigate('AppointmentDetail', {
                  babyId: selectedBabyId,
                  appointmentId: appointment.id,
                })
              }
            />
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Marcar consulta"
        style={styles.fab}
        onPress={() =>
          navigation.navigate('AppointmentForm', {
            babyId: selectedBabyId,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scopeRow: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  scroll: {
    padding: 16,
    paddingBottom: 96,
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
    gap: 12,
  },
  emptyListText: {
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
