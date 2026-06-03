/**
 * Modo Soninho — grid de 8 sons de ruido branco + player (play/pause, volume,
 * timer com fade out). Acessada por "Mais → Modo Soninho".
 *
 * Toca com a tela apagada (foreground service do track-player). Os audios sao
 * adicionados em res/raw pelo dev (ver assets/audio/CREDITS.md) — sem eles a UI
 * funciona mas nao sai som.
 */

import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import {
  Card,
  Chip,
  IconButton,
  Text,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

import { MutedText } from '@/shared/components';
import type { AppTheme } from '@/app/theme';

import { useSleepPlayer } from '../hooks/useSleepPlayer';
import { SLEEP_SOUNDS, SLEEP_TIMERS } from '../sounds';

function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function SleepScreen() {
  const theme = useTheme<AppTheme>();
  const player = useSleepPlayer();

  const containerStyle = { backgroundColor: theme.colors.background };
  const current = SLEEP_SOUNDS.find((s) => s.key === player.currentKey);

  return (
    <SafeAreaView edges={['top']} style={[styles.root, containerStyle]}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Modo Soninho
        </Text>
        <MutedText variant="bodyMedium">
          Sons que ajudam o bebê a dormir. Tocam com a tela apagada.
        </MutedText>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.grid}>
          {SLEEP_SOUNDS.map((sound) => {
            const active = player.currentKey === sound.key;
            return (
              <Pressable
                key={sound.key}
                style={styles.cell}
                onPress={() => player.select(sound)}
              >
                <Card
                  mode={active ? 'contained' : 'outlined'}
                  style={[
                    styles.soundCard,
                    active && { backgroundColor: theme.colors.primaryContainer },
                  ]}
                >
                  <Card.Content style={styles.soundContent}>
                    <MaterialCommunityIcons
                      name={sound.icon}
                      size={32}
                      color={active ? theme.colors.primary : theme.app.text.muted}
                    />
                    <Text variant="labelLarge" style={styles.soundLabel}>
                      {sound.label}
                    </Text>
                  </Card.Content>
                </Card>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      {/* PLAYER BAR */}
      {current && (
        <View style={[styles.player, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.playerTop}>
            <View style={styles.playerInfo}>
              <Text variant="titleSmall" numberOfLines={1}>
                {current.label}
              </Text>
              {player.remainingSeconds !== null && (
                <MutedText variant="bodySmall">
                  Para em {formatCountdown(player.remainingSeconds)}
                </MutedText>
              )}
            </View>

            <IconButton
              icon={player.isPlaying ? 'pause' : 'play'}
              mode="contained"
              size={28}
              onPress={() => player.toggle()}
            />
            <IconButton icon="stop" size={24} onPress={() => player.stop()} />
          </View>

          {/* VOLUME */}
          <View style={styles.volumeRow}>
            <IconButton
              icon="volume-minus"
              size={20}
              onPress={() => player.changeVolume(Math.max(0, player.volume - 0.1))}
            />
            <View style={styles.volumeBarTrack}>
              <View
                style={[
                  styles.volumeBarFill,
                  {
                    width: `${Math.round(player.volume * 100)}%`,
                    backgroundColor: theme.colors.primary,
                  },
                ]}
              />
            </View>
            <IconButton
              icon="volume-plus"
              size={20}
              onPress={() => player.changeVolume(Math.min(1, player.volume + 0.1))}
            />
          </View>

          {/* TIMER */}
          <View style={styles.timerRow}>
            {SLEEP_TIMERS.map((t) => (
              <Chip
                key={t.minutes}
                compact
                selected={player.timerMinutes === t.minutes}
                showSelectedCheck={false}
                onPress={() => player.changeTimer(t.minutes)}
                style={styles.timerChip}
              >
                {t.label}
              </Chip>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  title: { fontWeight: '700' },
  scroll: { padding: 16, paddingBottom: 24 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  cell: {
    width: '47%',
    flexGrow: 1,
  },
  soundCard: {
    borderRadius: 16,
  },
  soundContent: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  soundLabel: {
    textAlign: 'center',
  },
  player: {
    padding: 12,
    paddingBottom: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.3)',
  },
  playerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerInfo: { flex: 1 },
  volumeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  volumeBarTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128,128,128,0.25)',
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: 4,
    borderRadius: 2,
  },
  timerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  timerChip: {
    marginBottom: 4,
  },
});
