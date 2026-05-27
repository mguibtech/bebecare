/**
 * Reactotron — devtools para inspecao do app em desenvolvimento.
 *
 * Este modulo so eh carregado quando __DEV__ === true (require condicional
 * em index.js), entao todos os imports/efeitos colaterais aqui ficam fora
 * do bundle de producao.
 *
 * Plugins ativos:
 *  - useReactNative()              network, errors, log, devTools (asyncStorage off — nao usamos)
 *  - reactotronReactQuery          inspecao do cache do React Query
 *  - Zustand subscriptions         auth + theme stores
 *  - MMKV value-changed listener   eventos de escrita no storage 'bebecare'
 *
 * Tudo flui pro `console.tron` global e pro app desktop do Reactotron.
 *
 * Host: por padrao a lib autoresolve via Dev Settings (Metro). Em device
 * fisico pode ser necessario setar manualmente via REACTOTRON_HOST.
 */

import { NativeModules } from 'react-native';
import Reactotron from 'reactotron-react-native';
import {
  reactotronReactQuery,
  QueryClientManager,
} from 'reactotron-react-query';

import { queryClient } from '@/app/providers/queryClient';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { useThemeStore } from '@/app/theme/store';
import { storage } from '@/shared/storage/mmkv';

/**
 * Resolve o host do Reactotron a partir do Metro dev server (NativeModules
 * .SourceCode.scriptURL). Funciona em emulador Android (10.0.2.2), iOS
 * simulator (localhost) e device fisico (IP da maquina). Fallback: localhost.
 */
function resolveHost(): string {
  const scriptURL: string | undefined = NativeModules.SourceCode?.scriptURL;
  if (!scriptURL) {
    return 'localhost';
  }
  const match = scriptURL.match(/^https?:\/\/([^:/]+)/);
  return match?.[1] ?? 'localhost';
}

const queryClientManager = new QueryClientManager({ queryClient });

Reactotron.configure({
  name: 'BebeCare',
  host: resolveHost(),
})
  .useReactNative({
    // asyncStorage off — o app usa MMKV, nao AsyncStorage.
    asyncStorage: false,
  })
  .use(reactotronReactQuery(queryClientManager))
  .connect();

// Expoe globalmente para usar como `console.tron.log/display/...` em qualquer
// arquivo sem precisar importar.
(console as Console & { tron: typeof Reactotron }).tron = Reactotron;

// ============================================================
// Zustand — subscribe nas stores e envia estado pro Reactotron
// ============================================================

useAuthStore.subscribe((state, prevState) => {
  Reactotron.display({
    name: 'AUTH STORE',
    value: {
      status: state.status,
      hasAccessToken: state.accessToken !== null,
      hasRefreshToken: state.refreshToken !== null,
    },
    // Status mudou (booting → authenticated, signIn/signOut) merece destaque.
    important: state.status !== prevState.status,
  });
});

useThemeStore.subscribe((state, prevState) => {
  Reactotron.display({
    name: 'THEME STORE',
    value: { palette: state.palette },
    important: state.palette !== prevState.palette,
  });
});

// ============================================================
// MMKV — listener nativo de mudancas de valor
// ============================================================

storage.addOnValueChangedListener((key) => {
  // O listener nao entrega o valor; lemos sob demanda. Tentamos os tipos mais
  // comuns na ordem string → number → boolean.
  const value =
    storage.getString(key) ??
    storage.getNumber(key) ??
    storage.getBoolean(key);

  Reactotron.display({
    name: 'MMKV',
    preview: `set ${key}`,
    value: { key, value },
  });
});

Reactotron.log('Reactotron connected from BebeCare');

export default Reactotron;
