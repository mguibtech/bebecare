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

AppRegistry.registerComponent(appName, () => App);
