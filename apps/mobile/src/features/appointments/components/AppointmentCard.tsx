/**
 * Card de consulta — layout horizontal denso.
 *
 *   ┌────────────────────────────────────────────┐
 *   │ Puericultura          [chip Agendada]     │
 *   │ Dra. Ana Souza • 10/06 14:30              │
 *   └────────────────────────────────────────────┘
 *
 * Tap abre o detalhe (info + acoes).
 */

import { StyleSheet, View } from 'react-native';
import { Card, Text } from 'react-native-paper';

import { MutedText } from '@/shared/components';

import { StatusChip } from './StatusChip';
import type { Appointment } from '../types';

type AppointmentCardProps = {
  appointment: Appointment;
  onPress: () => void;
};

/** Formata ISO date-time pra "DD/MM HH:MM" curto. */
function formatShort(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} ${hours}:${minutes}`;
}

export function AppointmentCard({
  appointment,
  onPress,
}: AppointmentCardProps) {
  const detailParts = [
    appointment.doctorName,
    appointment.specialty,
    formatShort(appointment.scheduledAt),
  ].filter(Boolean);

  return (
    <Card mode="outlined" onPress={onPress} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <Text variant="titleSmall" style={styles.title} numberOfLines={1}>
            {appointment.title}
          </Text>
          <MutedText variant="bodySmall" numberOfLines={1}>
            {detailParts.join(' • ')}
          </MutedText>
        </View>
        <StatusChip status={appointment.status} compact />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
  },
});
