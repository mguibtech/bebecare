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
import { useTranslation } from 'react-i18next';
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

/** Chave i18n da saudação conforme o horário. */
function greetingKey(
  hour: number,
):
  | 'home.greetingMorning'
  | 'home.greetingAfternoon'
  | 'home.greetingEvening' {
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
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

type QuickActionProps = {
  icon: string;
  label: string;
  onPress: () => void;
  theme: AppTheme;
};

/** Atalho compacto (icone em circulo + label) pra fileira de acoes da Home. */
function QuickAction({ icon, label, onPress, theme }: QuickActionProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
    >
      <View
        style={[
          styles.quickIcon,
          { backgroundColor: theme.colors.primaryContainer },
        ]}
      >
        <Icon source={icon} size={26} color={theme.colors.primary} />
      </View>
      <Text variant="labelSmall" style={styles.quickLabel} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function HomeScreen() {
  const { t } = useTranslation();
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
          {t(greetingKey(new Date().getHours()))}
          {firstName ? `, ${firstName}` : ''}!
        </Text>
        <MutedText variant="bodySmall">
          {hasBabies ? t('home.summaryToday') : t('home.summaryStart')}
        </MutedText>

        {/* BEBE SELECIONADO ou EMPTY STATE */}
        {hasBabies && selectedBaby ? (
          <Pressable onPress={() => setSheetOpen(true)}>
            <Card style={styles.babyCard} mode="elevated">
              <Card.Title
                title={selectedBaby.name}
                subtitle={
                  selectedBaby.ageMonths === 0
                    ? t('home.ageDays', { count: selectedBaby.ageDays })
                    : t('home.ageMonths', { count: selectedBaby.ageMonths })
                }
                // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
                left={() => <BabyAvatar size={48} baby={selectedBaby} />}
                // eslint-disable-next-line react/no-unstable-nested-components -- render-prop pattern do Paper
                right={(props) => (
                  <Text {...props} variant="bodySmall" style={styles.tapHint}>
                    {t('home.switchBaby')}  ›
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
                {t('home.registerBabyTitle')}
              </Text>
              <MutedText variant="bodyMedium" style={styles.emptyBody}>
                {t('home.registerBabyBody')}
              </MutedText>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => navigation.navigate('BabyForm', undefined)}
                style={styles.emptyButton}
              >
                {t('home.registerBabyCta')}
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* ATALHOS RAPIDOS — acoes frequentes + expoe Soninho/Despertadores */}
        {hasBabies && selectedBaby && (
          <View style={styles.quickRow}>
            <QuickAction
              theme={theme}
              icon="calendar-plus"
              label={t('home.quickAppointment')}
              onPress={() =>
                navigation.navigate('AppointmentForm', {
                  babyId: selectedBaby.id,
                })
              }
            />
            <QuickAction
              theme={theme}
              icon="pill"
              label={t('home.quickMedication')}
              onPress={() =>
                navigation.navigate('MedicationForm', {
                  babyId: selectedBaby.id,
                })
              }
            />
            <QuickAction
              theme={theme}
              icon="weather-night"
              label={t('home.quickSleep')}
              onPress={() => navigation.navigate('Sleep')}
            />
            <QuickAction
              theme={theme}
              icon="alarm"
              label={t('home.quickAlarm')}
              onPress={() => navigation.navigate('Alarms')}
            />
          </View>
        )}

        {/* PROXIMAS ATIVIDADES (dados reais) */}
        {hasBabies && selectedBaby && (
          <Card style={styles.activityCard} mode="outlined">
            <Card.Title title={t('home.upcomingActivities')} />
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
                      label={t('home.overdueVaccines', { count: overdueVaccines })}
                      sub={t('home.seeCalendar')}
                      onPress={() => navigation.navigate('Vaccines')}
                    />
                  )}
                  {nextAppointment && (
                    <ActivityRow
                      theme={theme}
                      icon="stethoscope"
                      tint={theme.colors.primary}
                      label={nextAppointment.title}
                      sub={t('home.appointmentSub', {
                        when: formatWhen(nextAppointment.scheduledAt),
                      })}
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
                      label={t('home.pendingDoses', { count: pendingDoses })}
                      sub={t('home.seeDoses')}
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
                    {t('home.allClear')}
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
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    textAlign: 'center',
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
