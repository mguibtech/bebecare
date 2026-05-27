/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Reactotron — apenas em dev. Inicializa antes do App para que console.tron
// esteja disponivel quando os primeiros efeitos rodarem.
if (__DEV__) {
  require('./src/shared/dev/reactotron');
}

AppRegistry.registerComponent(appName, () => App);
