/**
 * Entry-point do app.
 * Toda logica vive em src/. Este arquivo so compoe providers + RootNavigator.
 */

import { StatusBar } from 'react-native';

import { AppProviders } from '@/app/providers/AppProviders';
import { RootNavigator } from '@/app/navigation/RootNavigator';

function App() {
  return (
    <AppProviders>
      <StatusBar barStyle="dark-content" />
      <RootNavigator />
    </AppProviders>
  );
}

export default App;
