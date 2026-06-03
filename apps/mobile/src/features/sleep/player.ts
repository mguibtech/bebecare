/**
 * Wrapper sobre o react-native-track-player pro Modo Soninho.
 *
 * - Toca um som em LOOP (RepeatMode.Track) com foreground service (toca de tela
 *   apagada).
 * - Fonte: recurso Android res/raw via URI em runtime (build-safe; ver sounds.ts).
 * - Tudo guardado com try/catch — se o modulo nativo ainda nao estiver no build
 *   (antes do rebuild) ou o audio nao existir, degrada sem quebrar o app.
 */

import TrackPlayer, {
  AppKilledPlaybackBehavior,
  Capability,
  RepeatMode,
} from 'react-native-track-player';

import type { SleepSound } from './sounds';

const PACKAGE = 'com.bebecare';

let setupDone = false;

async function ensureSetup(): Promise<void> {
  if (setupDone) return;
  try {
    // autoHandleInterruptions: pausa quando outro app toma o audio focus
    // (ligacao, outro player) e retoma depois.
    await TrackPlayer.setupPlayer({ autoHandleInterruptions: true });
  } catch {
    // "player already initialized" em hot-reload — ok.
  }
  try {
    await TrackPlayer.updateOptions({
      android: {
        appKilledPlaybackBehavior:
          AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
      },
      capabilities: [Capability.Play, Capability.Pause, Capability.Stop],
      compactCapabilities: [Capability.Play, Capability.Pause],
    });
    await TrackPlayer.setRepeatMode(RepeatMode.Track);
  } catch {
    // ignora
  }
  setupDone = true;
}

function soundUri(sound: SleepSound): string {
  return `android.resource://${PACKAGE}/raw/${sound.rawName}`;
}

/** Carrega e toca um som em loop, no volume dado (0..1). */
export async function playSound(
  sound: SleepSound,
  volume: number,
): Promise<void> {
  await ensureSetup();
  await TrackPlayer.reset();
  await TrackPlayer.add({
    id: sound.key,
    url: soundUri(sound),
    title: sound.label,
    artist: 'Modo Soninho',
  });
  await TrackPlayer.setVolume(volume);
  await TrackPlayer.play();
}

export async function pausePlayback(): Promise<void> {
  try {
    await TrackPlayer.pause();
  } catch {
    // ignora
  }
}

export async function resumePlayback(): Promise<void> {
  try {
    await TrackPlayer.play();
  } catch {
    // ignora
  }
}

export async function stopPlayback(): Promise<void> {
  try {
    await TrackPlayer.reset();
  } catch {
    // ignora
  }
}

export async function setPlaybackVolume(volume: number): Promise<void> {
  try {
    await TrackPlayer.setVolume(Math.max(0, Math.min(1, volume)));
  } catch {
    // ignora
  }
}
