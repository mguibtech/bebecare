/**
 * Catalogo dos sons do Modo Soninho (B10).
 *
 * Os arquivos de áudio NAO são versionados (são grandes e tem licença propria).
 * Cada som referência um recurso Android em res/raw via `rawName`. O player
 * monta a URI `android.resource://<pkg>/raw/<rawName>` em runtime — assim o app
 * COMPILA sem os arquivos; quando o usuário dropa os .ogg em res/raw, passam a
 * tocar (ver assets/áudio/CREDITS.md). V1 e Android-only.
 */

/**
 * `labelKey` é a chave i18n do nome do som — resolvida com t() na tela e com
 * i18n.t() no player (título da notificação nativa, fora do React).
 */
export const SLEEP_SOUNDS = [
  { key: 'white', labelKey: 'sleep.soundWhite', icon: 'waveform', rawName: 'sleep_white' },
  { key: 'brown', labelKey: 'sleep.soundBrown', icon: 'sine-wave', rawName: 'sleep_brown' },
  { key: 'rain', labelKey: 'sleep.soundRain', icon: 'weather-pouring', rawName: 'sleep_rain' },
  { key: 'fan', labelKey: 'sleep.soundFan', icon: 'fan', rawName: 'sleep_fan' },
  { key: 'heartbeat', labelKey: 'sleep.soundHeartbeat', icon: 'heart-pulse', rawName: 'sleep_heartbeat' },
  { key: 'womb', labelKey: 'sleep.soundWomb', icon: 'baby-face-outline', rawName: 'sleep_womb' },
  { key: 'ocean', labelKey: 'sleep.soundOcean', icon: 'waves', rawName: 'sleep_ocean' },
  { key: 'car', labelKey: 'sleep.soundCar', icon: 'car', rawName: 'sleep_car' },
] as const;

export type SleepSound = (typeof SLEEP_SOUNDS)[number];

/** Opções de timer (minutos). 0 = sem parar. */
export const SLEEP_TIMERS = [
  { minutes: 15, labelKey: 'sleep.timer15' },
  { minutes: 30, labelKey: 'sleep.timer30' },
  { minutes: 60, labelKey: 'sleep.timer60' },
  { minutes: 0, labelKey: 'sleep.timerOff' },
] as const;
