/**
 * Lista de medicamentos do bebê selecionado.
 *
 * Embarcada na HealthScreen quando a sub-tab "Remédios" esta ativa.
 *
 * Empty states:
 *  - 0 bebês na família → CTA pra cadastrar bebê
 *  - sem bebê selecionado → CTA pra Inicio
 *  - bebê sem medicamentos → CTA pra cadastrar primeiro remédio
 *
 * FAB pra criar medicamento. Tap em card abre detalhe.
 */

import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  FAB,
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

import { MedicationCard } from '../components/MedicationCard';
import { useMedications } from '../hooks/useMedications';

export function MedicationsListScreen() {
  const theme = useTheme<AppTheme>();
  const navigation =
    useNavigation<MainTabScreenProps<'Health'>['navigation']>();
  const babies = useBabies();
  const selectedBabyId = useBabySelectorStore((s) => s.selectedBabyId);
  const query = useMedications(selectedBabyId);

  const containerStyle = { backgroundColor: theme.colors.background };

  // ===== 0 bebês na família
  if (babies.data && babies.data.length === 0) {
    return (
      <View style={[styles.center, containerStyle]}>
        <MaterialCommunityIcons
          name="pill"
          size={80}
          color={theme.colors.primary}
        />
        <Text variant="headlineSmall" style={styles.emptyTitle}>
          Cadastre um bebê primeiro
        </Text>
        <MutedText variant="bodyMedium" style={styles.emptyBody}>
          Medicamentos são organizados por bebê.{'\n'}
          Cadastre na tab Início pra começar.
        </MutedText>
      </View>
    );
  }

  // ===== sem bebê selecionado
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
          Selecione um bebê na tab Início pra ver os remédios dele.
        </MutedText>
      </View>
    );
  }

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
            <Text>Erro ao carregar remédios</Text>
            <Button onPress={() => query.refetch()}>Tentar de novo</Button>
          </View>
        ) : !query.data || query.data.length === 0 ? (
          <View style={styles.emptyListBox}>
            <MaterialCommunityIcons
              name="pill-off"
              size={48}
              color={theme.app.text.muted}
            />
            <MutedText variant="bodyMedium" style={styles.emptyListText}>
              Nenhum remédio cadastrado.{'\n'}
              Use o + pra adicionar o primeiro.
            </MutedText>
          </View>
        ) : (
          query.data.map((medication) => (
            <MedicationCard
              key={medication.id}
              medication={medication}
              onPress={() =>
                navigation.navigate('MedicationDetail', {
                  babyId: selectedBabyId,
                  medicationId: medication.id,
                })
              }
            />
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Adicionar remédio"
        style={styles.fab}
        onPress={() =>
          navigation.navigate('MedicationForm', {
            babyId: selectedBabyId,
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
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
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
