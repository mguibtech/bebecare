/**
 * Catalogo dos sons do Modo Soninho (B10).
 *
 * Os arquivos de áudio NAO são versionados (são grandes e tem licença propria).
 * Cada som referência um recurso Android em res/raw via `rawName`. O player
 * monta a URI `android.resource://<pkg>/raw/<rawName>` em runtime — assim o app
 * COMPILA sem os arquivos; quando o usuário dropa os .ogg em res/raw, passam a
 * tocar (ver assets/áudio/CREDITS.md). V1 e Android-only.
 */

export type SleepSound = {
  key: string;
  label: string;
  /** Ícone MaterialCommunityIcons. */
  icon: string;
  /** Nome do recurso em android/app/src/main/res/raw/<rawName>.ogg (sem extensao). */
  rawName: string;
};

export const SLEEP_SOUNDS: SleepSound[] = [
  { key: 'white', label: 'Ruído branco', icon: 'waveform', rawName: 'sleep_white' },
  { key: 'brown', label: 'Ruído marrom', icon: 'sine-wave', rawName: 'sleep_brown' },
  { key: 'rain', label: 'Chuva', icon: 'weather-pouring', rawName: 'sleep_rain' },
  { key: 'fan', label: 'Ventilador', icon: 'fan', rawName: 'sleep_fan' },
  { key: 'heartbeat', label: 'Batimento', icon: 'heart-pulse', rawName: 'sleep_heartbeat' },
  { key: 'womb', label: 'Útero', icon: 'baby-face-outline', rawName: 'sleep_womb' },
  { key: 'ocean', label: 'Mar', icon: 'waves', rawName: 'sleep_ocean' },
  { key: 'car', label: 'Carro', icon: 'car', rawName: 'sleep_car' },
];

/** Opções de timer (minutos). 0 = sem parar. */
export const SLEEP_TIMERS = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 0, label: 'Sem parar' },
] as const;
