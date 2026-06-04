/**
 * Estado e controle do Modo Soninho.
 *
 * - Seleciona/troca o som (toca em loop).
 * - Play/pause, volume.
 * - Timer (15/30/60 min ou sem parar) com FADE OUT nos últimos 30s e stop.
 *
 * O countdown so corre enquanto tocando (congela no pause, continua no play).
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  pausePlayback,
  playSound,
  resumePlayback,
  setPlaybackVolume,
  stopPlayback,
} from '../player';
import type { SleepSound } from '../sounds';

const FADE_MS = 30_000;
const DEFAULT_VOLUME = 0.8;

export function useSleepPlayer() {
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [timerMinutes, setTimerMinutes] = useState(0); // 0 = sem parar
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  const remainingMsRef = useRef<number | null>(null);
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const doStop = useCallback(() => {
    clearTick();
    remainingMsRef.current = null;
    setRemainingSeconds(null);
    setIsPlaying(false);
    setCurrentKey(null);
    stopPlayback();
  }, [clearTick]);

  // Loop do countdown: roda enquanto tocando E ha timer ativo.
  useEffect(() => {
    clearTick();
    if (!isPlaying || remainingMsRef.current === null) return;

    intervalRef.current = setInterval(() => {
      const left = (remainingMsRef.current ?? 0) - 1000;
      remainingMsRef.current = left;
      setRemainingSeconds(Math.max(0, Math.ceil(left / 1000)));

      if (left <= FADE_MS) {
        // Fade out proporcional nos últimos 30s.
        setPlaybackVolume(volumeRef.current * Math.max(0, left / FADE_MS));
      }
      if (left <= 0) {
        doStop();
      }
    }, 1000);

    return clearTick;
  }, [isPlaying, timerMinutes, currentKey, clearTick, doStop]);

  const startTimerIfAny = useCallback((minutes: number) => {
    remainingMsRef.current = minutes > 0 ? minutes * 60_000 : null;
    setRemainingSeconds(minutes > 0 ? minutes * 60 : null);
  }, []);

  const select = useCallback(
    async (sound: SleepSound) => {
      setCurrentKey(sound.key);
      setIsPlaying(true);
      startTimerIfAny(timerMinutes);
      await playSound(sound, volumeRef.current);
    },
    [timerMinutes, startTimerIfAny],
  );

  const toggle = useCallback(async () => {
    if (!currentKey) return;
    if (isPlaying) {
      setIsPlaying(false);
      await pausePlayback();
    } else {
      setIsPlaying(true);
      await resumePlayback();
    }
  }, [currentKey, isPlaying]);

  const changeVolume = useCallback((v: number) => {
    setVolume(v);
    setPlaybackVolume(v);
  }, []);

  const changeTimer = useCallback(
    (minutes: number) => {
      setTimerMinutes(minutes);
      startTimerIfAny(minutes);
      // Saiu da zona de fade / sem timer → restaura o volume cheio.
      if (minutes === 0) setPlaybackVolume(volumeRef.current);
    },
    [startTimerIfAny],
  );

  // Cleanup ao desmontar.
  useEffect(() => () => clearTick(), [clearTick]);

  return {
    currentKey,
    isPlaying,
    volume,
    timerMinutes,
    remainingSeconds,
    select,
    toggle,
    stop: doStop,
    changeVolume,
    changeTimer,
  };
}
