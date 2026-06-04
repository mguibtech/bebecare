/**
 * Card de uma entry do schedule — layout horizontal denso.
 *
 *   ┌─────────────────────────────────────────────┐
 *   │ Nome da vacina             [chip status]   │
 *   │ 1ª dose • Prevista 24/10/25     [Marcar]   │
 *   └─────────────────────────────────────────────┘
 *
 * Coluna esquerda (info): nome + linha de detalhes
 * Coluna direita (ações): chip de status + botão "Marcar" (se aplicável)
 *
 * Tap no card abre o detalhe; tap no botão "Marcar" abre o RegisterVaccineSheet.
 */

import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';

import { StatusChip } from './StatusChip';
import { VaccineStatus, type ScheduleEntry } from '../types';

type VaccineEntryCardProps = {
  entry: ScheduleEntry;
  onPress: () => void;
  onMarkApplied?: () => void;
};

/** YYYY-MM-DD → DD/MM/AAAA. */
function formatDate(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

export function VaccineEntryCard({
  entry,
  onPress,
  onMarkApplied,
}: VaccineEntryCardProps) {
  const { t } = useTranslation();
  const { vaccine, status, appliedAt, expectedAt } = entry;
  const canMark = status !== VaccineStatus.APPLIED && onMarkApplied;

  // Linha de detalhes condensada: "1ª dose • Reforço? • Prevista 24/10/25".
  // Nota: vaccine.doseLabel vem do backend em pt — i18n completo dele exige
  // localizacao no servidor; aqui localizamos o resto (reforco + datas).
  const dateText = appliedAt
    ? t('vaccines.appliedAt', { date: formatDate(appliedAt) })
    : t('vaccines.expectedAt', { date: formatDate(expectedAt) });
  const detailLine = [
    vaccine.doseLabel,
    vaccine.isBooster ? t('vaccines.booster') : null,
    dateText,
  ]
    .filter(Boolean)
    .join(' • ');

  return (
    <Card style={styles.card} mode="outlined" onPress={onPress}>
      <View style={styles.row}>
        {/* Coluna info — ocupa todo espaço restante */}
        <View style={styles.info}>
          <Text variant="titleSmall" style={styles.name} numberOfLines={1}>
            {vaccine.name}
          </Text>
          <Text variant="bodySmall" style={styles.muted} numberOfLines={1}>
            {detailLine}
          </Text>
        </View>

        {/* Coluna acoes — chip status + botao marcar (se aplicavel) */}
        <View style={styles.actions}>
          <StatusChip status={status} compact />
          {canMark && (
            <Button
              icon="check"
              mode="contained-tonal"
              compact
              onPress={onMarkApplied}
              accessibilityLabel={t('vaccines.markApplied')}
              contentStyle={styles.markButtonContent}
              labelStyle={styles.markButtonLabel}
              style={styles.markButton}
            >
              {t('vaccines.markApplied')}
            </Button>
          )}
        </View>
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
  name: {
    fontWeight: '700',
  },
  muted: {
    opacity: 0.7,
  },
  actions: {
    alignItems: 'flex-end',
    gap: 6,
  },
  markButton: {
    minWidth: 0,
  },
  markButtonContent: {
    paddingHorizontal: 4,
    height: 28,
  },
  markButtonLabel: {
    marginVertical: 0,
    marginHorizontal: 8,
    fontSize: 12,
  },
});
