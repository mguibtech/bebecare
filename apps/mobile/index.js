/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import {
  isFirebaseConfigured,
  registerBackgroundHandler,
} from './src/features/notifications';
import { registerAlarmBackgroundHandler } from './src/features/medications/alarms';
import TrackPlayer from 'react-native-track-player';

// Reactotron — apenas em dev. Inicializa antes do App para que console.tron
// esteja disponivel quando os primeiros efeitos rodarem.
if (__DEV__) {
  require('./src/shared/dev/reactotron');
}

// Push em background/quit: o handler PRECISA ser registrado no escopo de modulo,
// fora da arvore React. Guardado por isFirebaseConfigured() pra nao quebrar
// quando o google-services.json ainda nao foi adicionado (ver M6/6A).
if (isFirebaseConfigured()) {
  registerBackgroundHandler();
}

// Alarmes locais (notifee) em background/quit: ponto de entrega dos eventos do
// alarme de remedio. Independe do Firebase. No-op seguro se o modulo nativo do
// notifee ainda nao estiver no build.
registerAlarmBackgroundHandler();

// Modo Soninho: registra o playback service do track-player (escopo de modulo).
// Guardado — no-op se o modulo nativo ainda nao estiver no build.
try {
  TrackPlayer.registerPlaybackService(() => require('./service'));
} catch {
  // track-player nativo indisponivel (antes do rebuild): ignora.
}

AppRegistry.registerComponent(appName, () => App);
