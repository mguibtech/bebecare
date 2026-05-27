/**
 * Detalhe do bebe — perfil visualizavel.
 *
 * Acesso: via BabySelectorSheet ("Ver perfil") ou via long-press no avatar.
 * Mostra todas as informacoes em cards. Botao "Editar" no header navega
 * pro BabyForm com babyId.
 */

import { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Appbar,
  Card,
  Chip,
  Text,
  useTheme,
} from 'react-native-paper';

import type { AppScreenProps } from '@/app/navigation/types';
import type { AppTheme } from '@/app/theme';

import { BabyAvatar } from '../components/BabyAvatar';
import { useBaby } from '../hooks/useBaby';
import {
  BLOOD_TYPE_LABELS,
  SEX_LABELS,
  type Baby,
} from '../types';

/** Formata idade legivel: "9 meses (274 dias)". */
function formatAge(baby: Baby): string {
  const { ageMonths, ageDays } = baby;
  if (ageMonths === 0) {
    return `${ageDays} dia${ageDays !== 1 ? 's' : ''}`;
  }
  return `${ageMonths} ${ageMonths === 1 ? 'mes' : 'meses'} (${ageDays} dias)`;
}

/** Formata YYYY-MM-DD pra DD/MM/AAAA. */
function formatDate(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

export function BabyDetailScreen({
  route,
  navigation,
}: AppScreenProps<'BabyDetail'>) {
  const { babyId } = route.params;
  const theme = useTheme<AppTheme>();
  const baby = useBaby(babyId);

  // Botao Editar no header
  useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components -- headerRight do RN Navigation eh render-prop padrao
      headerRight: () => (
        <Appbar.Action
          icon="pencil"
          accessibilityLabel="Editar"
          onPress={() => navigation.navigate('BabyForm', { babyId })}
        />
      ),
    });
  }, [navigation, babyId]);

  if (baby.isPending) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (baby.isError || !baby.data) {
    return (
      <View
        style={[styles.center, { backgroundColor: theme.colors.background }]}
      >
        <Text variant="bodyLarge">Bebe nao encontrado</Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
          {baby.error?.message ?? 'Tente voltar e abrir de novo.'}
        </Text>
      </View>
    );
  }

  const b = baby.data;
  const hasMeasurements = b.birthWeightGrams || b.birthHeightCm;
  const hasMedical = b.bloodType || b.allergies || b.eyeColor;

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.scroll}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <BabyAvatar size={96} baby={b} />
        <Text variant="headlineSmall" style={styles.name}>
          {b.name}
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          {formatAge(b)}
        </Text>
        <View style={styles.chipsRow}>
          <Chip icon={b.sex === 'male' ? 'gender-male' : 'gender-female'} compact>
            {SEX_LABELS[b.sex]}
          </Chip>
          <Chip icon="cake-variant" compact>
            {formatDate(b.birthDate)}
          </Chip>
        </View>
      </View>

      {/* MEDIDAS AO NASCER */}
      {hasMeasurements && (
        <Card style={styles.card} mode="outlined">
          <Card.Title title="Ao nascer" />
          <Card.Content>
            {b.birthWeightGrams !== null && (
              <Text variant="bodyMedium" style={styles.row}>
                Peso: {b.birthWeightGrams}g
              </Text>
            )}
            {b.birthHeightCm !== null && (
              <Text variant="bodyMedium" style={styles.row}>
                Altura: {b.birthHeightCm}cm
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* INFO MEDICAS */}
      {hasMedical && (
        <Card style={styles.card} mode="outlined">
          <Card.Title title="Informacoes medicas" />
          <Card.Content>
            {b.bloodType && (
              <Text variant="bodyMedium" style={styles.row}>
                Tipo sanguineo: {BLOOD_TYPE_LABELS[b.bloodType]}
              </Text>
            )}
            {b.eyeColor && (
              <Text variant="bodyMedium" style={styles.row}>
                Cor dos olhos: {b.eyeColor}
              </Text>
            )}
            {b.allergies && (
              <Text variant="bodyMedium" style={styles.row}>
                Alergias: {b.allergies}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* NOTAS */}
      {b.notes && (
        <Card style={styles.card} mode="outlined">
          <Card.Title title="Observacoes" />
          <Card.Content>
            <Text variant="bodyMedium">{b.notes}</Text>
          </Card.Content>
        </Card>
      )}

      {!hasMeasurements && !hasMedical && !b.notes && (
        <Text variant="bodySmall" style={styles.placeholder}>
          Toque em Editar pra adicionar mais informacoes.
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 16,
    paddingBottom: 48,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    marginTop: 12,
    fontWeight: '700',
  },
  muted: {
    opacity: 0.7,
    marginTop: 4,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  card: {
    marginBottom: 12,
  },
  row: {
    paddingVertical: 4,
  },
  placeholder: {
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 24,
  },
  errorMessage: {
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
});
