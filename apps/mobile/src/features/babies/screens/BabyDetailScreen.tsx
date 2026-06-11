/**
 * Detalhe do bebê — perfil visualizavel.
 *
 * Acesso: via BabySelectorSheet ("Ver perfil") ou via long-press no avatar.
 * Mostra todas as informações em cards. Botao "Editar" no header navega
 * pro BabyForm com babyId.
 */

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
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
  type Baby,
} from '../types';

/** Formata idade legivel: "9 meses (274 dias)". */
function formatAge(baby: Baby, t: TFunction): string {
  const { ageMonths, ageDays } = baby;
  if (ageMonths === 0) {
    return t('home.ageDays', { count: ageDays });
  }
  return `${t('home.ageMonths', { count: ageMonths })} (${t('home.ageDays', {
    count: ageDays,
  })})`;
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
  const { t } = useTranslation();
  const baby = useBaby(babyId);

  // Botao Editar no header
  useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components -- headerRight do RN Navigation eh render-prop padrao
      headerRight: () => (
        <Appbar.Action
          icon="pencil"
          accessibilityLabel={t('common.edit')}
          onPress={() => navigation.navigate('BabyForm', { babyId })}
        />
      ),
    });
  }, [navigation, babyId, t]);

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
        <Text variant="bodyLarge">{t('babies.notFound')}</Text>
        <Text variant="bodyMedium" style={styles.errorMessage}>
          {baby.error?.message ?? t('family.loadErrorHint')}
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
          {formatAge(b, t)}
        </Text>
        <View style={styles.chipsRow}>
          <Chip icon={b.sex === 'male' ? 'gender-male' : 'gender-female'} compact>
            {t(b.sex === 'male' ? 'babies.sexMale' : 'babies.sexFemale')}
          </Chip>
          <Chip icon="cake-variant" compact>
            {formatDate(b.birthDate)}
          </Chip>
        </View>
      </View>

      {/* MEDIDAS AO NASCER */}
      {hasMeasurements && (
        <Card style={styles.card} mode="outlined">
          <Card.Title title={t('babies.atBirth')} />
          <Card.Content>
            {b.birthWeightGrams !== null && (
              <Text variant="bodyMedium" style={styles.row}>
                {t('babies.weightRow', { grams: b.birthWeightGrams })}
              </Text>
            )}
            {b.birthHeightCm !== null && (
              <Text variant="bodyMedium" style={styles.row}>
                {t('babies.heightRow', { cm: b.birthHeightCm })}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* INFO MEDICAS */}
      {hasMedical && (
        <Card style={styles.card} mode="outlined">
          <Card.Title title={t('babies.medicalInfo')} />
          <Card.Content>
            {b.bloodType && (
              <Text variant="bodyMedium" style={styles.row}>
                {t('babies.bloodTypeRow', {
                  value: BLOOD_TYPE_LABELS[b.bloodType],
                })}
              </Text>
            )}
            {b.eyeColor && (
              <Text variant="bodyMedium" style={styles.row}>
                {t('babies.eyeColorRow', { value: b.eyeColor })}
              </Text>
            )}
            {b.allergies && (
              <Text variant="bodyMedium" style={styles.row}>
                {t('babies.allergiesRow', { value: b.allergies })}
              </Text>
            )}
          </Card.Content>
        </Card>
      )}

      {/* NOTAS */}
      {b.notes && (
        <Card style={styles.card} mode="outlined">
          <Card.Title title={t('babies.notesTitle')} />
          <Card.Content>
            <Text variant="bodyMedium">{b.notes}</Text>
          </Card.Content>
        </Card>
      )}

      {!hasMeasurements && !hasMedical && !b.notes && (
        <Text variant="bodySmall" style={styles.placeholder}>
          {t('babies.emptyDetail')}
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
