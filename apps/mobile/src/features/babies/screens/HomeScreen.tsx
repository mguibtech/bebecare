/**
 * Tab "Início" — dashboard centrado no bebê selecionado.
 *
 * Sections:
 *  1. Saudação do user (compacta)
 *  2. Card do bebê selecionado (ou empty state se 0 bebês)
 *  3. Placeholder de "Próximas atividades" (preenchido conforme M4-M6 chegam:
 *     vacinas atrasadas, próximas consultas, doses do dia)
 *
 * Settings (tema/modo), família e Sair MIGRARAM pra tab "Mais".
 * Sheet de seleção de bebê abre ao tocar no card do bebê.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useMe } from '@/features/auth/hooks/useMe';
import type { AppTheme } from '@/app/theme';
import type { MainTabScreenProps } from '@/app/navigation/types';

import { BabyAvatar } from '../components/BabyAvatar';
import { BabySelectorSheet } from '../components/BabySelectorSheet';
import { useBabies } from '../hooks/useBabies';
import { useBabySelectorStore } from '../store/baby-selector.store';
import type { Baby } from '../types';

/** Idade em formato curto pro card. */
function ageShort(b: Baby): string {
  if (b.ageMonths === 0) {
    return `${b.ageDays} dia${b.ageDays !== 1 ? 's' : ''}`;
  }
  return `${b.ageMonths} ${b.ageMonths === 1 ? 'mes' : 'meses'}`;
}

export function HomeScreen() {
  const navigation = useNavigation<MainTabScreenProps<'Home'>['navigation']>();
  const me = useMe();
  const babies = useBabies();
  const theme = useTheme<AppTheme>();
  const selectedBabyId = useBabySelectorStore((s) => s.selectedBabyId);

  const [sheetOpen, setSheetOpen] = useState(false);

  const containerStyle = { backgroundColor: theme.colors.background };

  if (me.isPending || babies.isPending) {
    return (
      <SafeAreaView edges={['top']} style={[styles.center, containerStyle]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  const userName = me.data?.user.name ?? 'voce';
  const selectedBaby =
    babies.data?.find((b) => b.id === selectedBabyId) ?? null;
  const hasBabies = babies.data && babies.data.length > 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, containerStyle]}>
      <ScrollView contentContainerStyle={styles.scroll}>
      {/* SAUDACAO */}
      <Text variant="titleMedium" style={styles.greeting}>
        Oi, {userName.split(' ')[0]}!
      </Text>
      <Text variant="bodySmall" style={styles.muted}>
        {hasBabies
          ? 'Aqui esta o resumo do dia.'
          : 'Vamos comecar cadastrando seu bebe.'}
      </Text>

      {/* BEBE SELECIONADO ou EMPTY STATE */}
      {hasBabies && selectedBaby ? (
        <Pressable onPress={() => setSheetOpen(true)}>
          <Card style={styles.babyCard} mode="elevated">
            <Card.Title
              title={selectedBaby.name}
              subtitle={ageShort(selectedBaby)}
              // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
              left={() => <BabyAvatar size={48} baby={selectedBaby} />}
              // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
              right={(props) => (
                <Text {...props} variant="bodySmall" style={styles.tapHint}>
                  trocar  ›
                </Text>
              )}
            />
          </Card>
        </Pressable>
      ) : (
        <Card style={styles.babyCard} mode="outlined">
          <Card.Content style={styles.emptyContent}>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Cadastre seu bebe
            </Text>
            <Text variant="bodyMedium" style={styles.emptyBody}>
              Vacinas, consultas, marcos e mais — tudo num lugar so.
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => navigation.navigate('BabyForm', undefined)}
              style={styles.emptyButton}
            >
              Cadastrar bebe
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* PLACEHOLDER: proximas atividades — M4+ preenche */}
      {hasBabies && (
        <Card style={styles.placeholderCard} mode="outlined">
          <Card.Title title="Proximas atividades" />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.muted}>
              Em breve: vacinas atrasadas, consultas marcadas, doses do dia.
            </Text>
          </Card.Content>
        </Card>
      )}

      </ScrollView>

      {/* SHEET de selecao de bebe */}
      <BabySelectorSheet
        visible={sheetOpen}
        onDismiss={() => setSheetOpen(false)}
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
  },
  greeting: {
    fontWeight: '700',
    marginBottom: 4,
  },
  muted: {
    opacity: 0.7,
  },
  babyCard: {
    marginTop: 16,
    marginBottom: 16,
  },
  tapHint: {
    opacity: 0.5,
    marginRight: 12,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyBody: {
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyButton: {
    marginTop: 8,
  },
  placeholderCard: {
    marginTop: 8,
  },
});
