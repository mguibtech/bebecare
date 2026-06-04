/**
 * Lista de despertadores do usuário. Acessada por "Mais → Despertadores".
 *
 * FAB pra criar. Tap no card edita. Switch liga/desliga inline (o sync local
 * reagenda o notifee). Empty state quando não ha nenhum.
 */

import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  FAB,
  Text,
  useTheme,
} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { MutedText } from '@/shared/components';
import type { AppTheme } from '@/app/theme';
import type { AppScreenProps } from '@/app/navigation/types';

import { AlarmCard } from '../components/AlarmCard';
import { useAlarms } from '../hooks/useAlarms';
import { useUpdateAlarm } from '../hooks/useAlarmMutations';

export function AlarmsListScreen({ navigation }: AppScreenProps<'Alarms'>) {
  const theme = useTheme<AppTheme>();
  const query = useAlarms();
  const update = useUpdateAlarm();

  const containerStyle = { backgroundColor: theme.colors.background };

  return (
    <View style={[styles.root, containerStyle]}>
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
            <Text>Erro ao carregar despertadores</Text>
            <Button onPress={() => query.refetch()}>Tentar de novo</Button>
          </View>
        ) : !query.data || query.data.length === 0 ? (
          <View style={styles.emptyBox}>
            <MaterialCommunityIcons
              name="alarm"
              size={72}
              color={theme.colors.primary}
            />
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nenhum despertador
            </Text>
            <MutedText variant="bodyMedium" style={styles.emptyText}>
              Crie lembretes de mamada, troca de fralda{'\n'}
              ou soneca. Tocam mesmo com o app fechado.
            </MutedText>
          </View>
        ) : (
          query.data.map((alarm) => (
            <AlarmCard
              key={alarm.id}
              alarm={alarm}
              busy={update.isPending && update.variables?.id === alarm.id}
              onToggle={(next) =>
                update.mutate({ id: alarm.id, body: { isActive: next } })
              }
              onPress={() => navigation.navigate('AlarmForm', { alarmId: alarm.id })}
            />
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Adicionar"
        style={styles.fab}
        onPress={() => navigation.navigate('AlarmForm')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 96 },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyBox: {
    paddingVertical: 56,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontWeight: '700',
    marginTop: 8,
  },
  emptyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
