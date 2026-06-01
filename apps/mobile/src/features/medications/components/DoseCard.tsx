/**
 * Card de uma dose do dia (MedDoseLog) na tela "Hoje".
 *
 * Visual por status:
 *  - PENDING       → relogio + botoes "Tomei" / "Pular"
 *  - PENDING atrasada (scheduledFor < agora) → destaque warning + "Atrasada"
 *  - TAKEN         → check verde + hora que tomou + "Desfazer"
 *  - SKIPPED       → x cinza + motivo (se houver) + "Desfazer"
 *
 * Componente NAO conhece babyId — quem usa passa os handlers.
 * Tap no corpo abre o detalhe do medicamento.
 */

import { StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Text, useTheme } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { MutedText } from '@/shared/components';
import type { AppTheme } from '@/app/theme';

import { DOSE_UNIT_LABELS, DoseStatus, type MedDoseLog } from '../types';

export type DoseCardProps = {
  dose: MedDoseLog;
  /** True quando alguma mutation desta dose esta em andamento. */
  busy?: boolean;
  onTake: () => void;
  onSkip: () => void;
  onReset: () => void;
  onPress?: () => void;
};

/** "2026-06-01T08:00:00.000Z" → "08:00" (hora local). */
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--:--';
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

export function DoseCard({
  dose,
  busy,
  onTake,
  onSkip,
  onReset,
  onPress,
}: DoseCardProps) {
  const theme = useTheme<AppTheme>();

  const isPending = dose.status === DoseStatus.PENDING;
  const isTaken = dose.status === DoseStatus.TAKEN;
  const isSkipped = dose.status === DoseStatus.SKIPPED;
  const isOverdue = isPending && new Date(dose.scheduledFor).getTime() < Date.now();

  const accent = isTaken
    ? theme.app.success
    : isOverdue
      ? theme.app.warning
      : isSkipped
        ? theme.app.text.muted
        : theme.colors.primary;

  const statusIcon = isTaken
    ? 'check-circle'
    : isSkipped
      ? 'close-circle'
      : isOverdue
        ? 'alert-circle'
        : 'clock-outline';

  const med = dose.medication;

  return (
    <Card
      mode="outlined"
      style={[styles.card, { borderLeftColor: accent }]}
      onPress={onPress}
    >
      <Card.Content style={styles.content}>
        <View style={styles.timeCol}>
          <Text variant="titleMedium" style={styles.time}>
            {formatTime(dose.scheduledFor)}
          </Text>
          <MaterialCommunityIcons
            name={statusIcon}
            size={18}
            color={accent}
          />
        </View>

        <View style={styles.infoCol}>
          <Text variant="titleSmall" style={styles.name} numberOfLines={1}>
            {med.name}
          </Text>
          <MutedText variant="bodySmall">
            {Number(med.dose)} {DOSE_UNIT_LABELS[med.doseUnit]}
          </MutedText>

          {isOverdue && (
            <Text
              variant="labelSmall"
              style={[styles.statusLabel, { color: theme.app.warning }]}
            >
              Atrasada
            </Text>
          )}
          {isTaken && dose.takenAt && (
            <Text
              variant="labelSmall"
              style={[styles.statusLabel, { color: theme.app.success }]}
            >
              Tomada às {formatTime(dose.takenAt)}
            </Text>
          )}
          {isSkipped && (
            <MutedText variant="labelSmall" style={styles.statusLabel}>
              Pulada{dose.skipReason ? ` — ${dose.skipReason}` : ''}
            </MutedText>
          )}

          {isPending && (
            <View style={styles.actions}>
              <Button
                mode="contained"
                compact
                icon="check"
                onPress={onTake}
                loading={busy}
                disabled={busy}
                style={styles.takeBtn}
              >
                Tomei
              </Button>
              <Button
                mode="text"
                compact
                onPress={onSkip}
                disabled={busy}
              >
                Pular
              </Button>
            </View>
          )}
        </View>

        {!isPending && (
          <IconButton
            icon="undo-variant"
            size={20}
            accessibilityLabel="Desfazer"
            onPress={onReset}
            disabled={busy}
          />
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingVertical: 4,
  },
  timeCol: {
    alignItems: 'center',
    gap: 2,
    minWidth: 48,
  },
  time: {
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontWeight: '600',
  },
  statusLabel: {
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  takeBtn: {
    borderRadius: 20,
  },
});
