/**
 * Tab "Início" — dashboard centrado no bebê selecionado.
 *
 * Sections:
 *  1. Saudação do user (por horário do dia)
 *  2. Card do bebê selecionado (ou empty state se 0 bebês)
 *  3. "Próximas atividades" — agrega dados reais: vacinas atrasadas,
 *     próxima consulta e doses de remédio pendentes hoje. Cada item leva
 *     pra tela correspondente. Se nada pendente, mostra "tudo em dia".
 *
 * Settings (tema/modo), família e Sair vivem na tab "Mais".
 * Sheet de seleção de bebê abre ao tocar no card do bebê.
 */

import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Card,
  Icon,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useMe } from '@/features/auth/hooks/useMe';
import { useAppointments } from '@/features/appointments/hooks/useAppointments';
import { AppointmentStatus } from '@/features/appointments/types';
import { useTodayDoses } from '@/features/medications/hooks/useTodayDoses';
import { DoseStatus } from '@/features/medications/types';
import { useBabyVaccineSchedule } from '@/features/vaccines/hooks/useBabyVaccineSchedule';
import { VaccineStatus } from '@/features/vaccines/types';
import { MutedText } from '@/shared/components';
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
  return `${b.ageMonths} ${b.ageMonths === 1 ? 'mês' : 'meses'}`;
}

/** Saudação conforme o horário. */
function greeting(hour: number): string {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Formata ISO date-time pra "DD/MM às HH:MM". */
function formatWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} às ${h}:${m}`;
}

type ActivityRowProps = {
  icon: string;
  tint: string;
  label: string;
  sub?: string;
  onPress: () => void;
  theme: AppTheme;
};

function ActivityRow({ icon, tint, label, sub, onPress, theme }: ActivityRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.activityRow, pressed && styles.pressed]}
    >
      <View style={[styles.activityIcon, { backgroundColor: tint + '22' }]}>
        <Icon source={icon} size={22} color={tint} />
      </View>
      <View style={styles.activityText}>
        <Text variant="bodyMedium" style={styles.activityLabel} numberOfLines={1}>
          {label}
        </Text>
        {sub ? (
          <MutedText variant="bodySmall" numberOfLines={1}>
            {sub}
          </MutedText>
        ) : null}
      </View>
      <Icon source="chevron-right" size={22} color={theme.app.text.muted} />
    </Pressable>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<MainTabScreenProps<'Home'>['navigation']>();
  const me = useMe();
  const babies = useBabies();
  const theme = useTheme<AppTheme>();
  const selectedBabyId = useBabySelectorStore((s) => s.selectedBabyId);

  const [sheetOpen, setSheetOpen] = useState(false);

  const selectedBaby =
    babies.data?.find((b) => b.id === selectedBabyId) ?? null;

  // Dados reais do bebê selecionado (so rodam com babyId valido).
  const schedule = useBabyVaccineSchedule(selectedBaby?.id);
  const appointments = useAppointments(selectedBaby?.id, 'upcoming');
  const doses = useTodayDoses(selectedBaby?.id);

  const containerStyle = { backgroundColor: theme.colors.background };

  if (me.isPending || babies.isPending) {
    return (
      <SafeAreaView edges={['top']} style={[styles.center, containerStyle]}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  // Sem nome (perfil ainda carregando ou em erro) -> saudacao sem nome, em vez
  // de inventar um "você" minusculo que parece bug.
  const firstName = me.data?.user.name?.split(' ')[0];
  const hasBabies = babies.data && babies.data.length > 0;

  // ----- Agrega "próximas atividades" -----
  const overdueVaccines =
    schedule.data?.summary[VaccineStatus.OVERDUE] ?? 0;

  const nextAppointment = (appointments.data ?? [])
    .filter((a) => a.status === AppointmentStatus.SCHEDULED)
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0];

  const pendingDoses = (doses.data ?? []).filter(
    (d) => d.status === DoseStatus.PENDING,
  ).length;

  const activitiesLoading =
    schedule.isPending || appointments.isPending || doses.isPending;
  const hasActivities =
    overdueVaccines > 0 || Boolean(nextAppointment) || pendingDoses > 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.safe, containerStyle]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* SAUDACAO */}
        <Text variant="titleMedium" style={styles.greeting}>
          {greeting(new Date().getHours())}
          {firstName ? `, ${firstName}` : ''}!
        </Text>
        <MutedText variant="bodySmall">
          {hasBabies
            ? 'Aqui está o resumo do dia.'
            : 'Vamos começar cadastrando seu bebê.'}
        </MutedText>

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
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: theme.colors.primaryContainer },
                ]}
              >
                <Icon
                  source="baby-face-outline"
                  size={44}
                  color={theme.colors.primary}
                />
              </View>
              <Text variant="titleMedium" style={styles.emptyTitle}>
                Cadastre seu bebê
              </Text>
              <MutedText variant="bodyMedium" style={styles.emptyBody}>
                Vacinas, consultas, marcos e mais — tudo num lugar so.
              </MutedText>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => navigation.navigate('BabyForm', undefined)}
                style={styles.emptyButton}
              >
                Cadastrar bebê
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* PROXIMAS ATIVIDADES (dados reais) */}
        {hasBabies && selectedBaby && (
          <Card style={styles.activityCard} mode="outlined">
            <Card.Title title="Próximas atividades" />
            <Card.Content>
              {activitiesLoading ? (
                <ActivityIndicator style={styles.activityLoading} />
              ) : hasActivities ? (
                <View style={styles.activityList}>
                  {overdueVaccines > 0 && (
                    <ActivityRow
                      theme={theme}
                      icon="needle"
                      tint={theme.colors.error}
                      label={`${overdueVaccines} vacina${overdueVaccines > 1 ? 's' : ''} atrasada${overdueVaccines > 1 ? 's' : ''}`}
                      sub="Toque pra ver o calendário"
                      onPress={() => navigation.navigate('Vaccines')}
                    />
                  )}
                  {nextAppointment && (
                    <ActivityRow
                      theme={theme}
                      icon="stethoscope"
                      tint={theme.colors.primary}
                      label={nextAppointment.title}
                      sub={`Consulta • ${formatWhen(nextAppointment.scheduledAt)}`}
                      onPress={() =>
                        navigation.navigate('AppointmentDetail', {
                          babyId: selectedBaby.id,
                          appointmentId: nextAppointment.id,
                        })
                      }
                    />
                  )}
                  {pendingDoses > 0 && (
                    <ActivityRow
                      theme={theme}
                      icon="pill"
                      tint={theme.app.warning}
                      label={`${pendingDoses} dose${pendingDoses > 1 ? 's' : ''} de remédio hoje`}
                      sub="Toque pra ver as doses"
                      onPress={() => navigation.navigate('Today')}
                    />
                  )}
                </View>
              ) : (
                <View style={styles.allClear}>
                  <Icon
                    source="check-circle"
                    size={20}
                    color={theme.app.success}
                  />
                  <MutedText variant="bodyMedium" style={styles.allClearText}>
                    Esta tudo em dia por aqui! 🎉
                  </MutedText>
                </View>
              )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* SHEET de selecao de bebê */}
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
  emptyIcon: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyBody: {
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyButton: {
    marginTop: 8,
  },
  activityCard: {
    marginTop: 8,
  },
  activityList: {
    gap: 4,
  },
  activityLoading: {
    paddingVertical: 12,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  pressed: {
    opacity: 0.6,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    flex: 1,
  },
  activityLabel: {
    fontWeight: '600',
  },
  allClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  allClearText: {
    flex: 1,
  },
});
