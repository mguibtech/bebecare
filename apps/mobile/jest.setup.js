/**
 * Setup global do Jest.
 * Mocka modulos nativos que nao funcionam em JSDOM/Node.
 */

// Reanimated tem mock oficial
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

// MMKV nao roda em Node sem JNI; mock simples em memoria
jest.mock('react-native-mmkv', () => {
  class MMKVMock {
    store = new Map();
    getString(k) {
      return this.store.get(k);
    }
    getNumber(k) {
      return this.store.get(k);
    }
    getBoolean(k) {
      return this.store.get(k);
    }
    set(k, v) {
      this.store.set(k, v);
    }
    delete(k) {
      this.store.delete(k);
    }
    clearAll() {
      this.store.clear();
    }
    contains(k) {
      return this.store.has(k);
    }
  }
  return { MMKV: MMKVMock };
});

// Keychain: mock em memoria
jest.mock('react-native-keychain', () => {
  let stored = null;
  return {
    setGenericPassword: jest.fn(async (u, p) => {
      stored = { username: u, password: p };
      return true;
    }),
    getGenericPassword: jest.fn(async () => stored),
    resetGenericPassword: jest.fn(async () => {
      stored = null;
      return true;
    }),
  };
});

// Firebase: modulos nativos (RNFBAppModule) nao existem em Node.
// getApps() => [] simula "Firebase nao configurado" (sem google-services.json),
// que e o estado em que todo o codigo de push deve ser no-op. Testes que
// precisem do caminho "configurado" sobrescrevem getApps com jest.spyOn.
jest.mock('@react-native-firebase/app', () => ({
  getApp: jest.fn(),
  getApps: jest.fn(() => []),
}));

jest.mock('@react-native-firebase/messaging', () => ({
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    EPHEMERAL: 3,
  },
  getMessaging: jest.fn(() => ({})),
  getToken: jest.fn(async () => 'mock-fcm-token'),
  hasPermission: jest.fn(async () => -1),
  requestPermission: jest.fn(async () => 1),
  onMessage: jest.fn(() => jest.fn()),
  onTokenRefresh: jest.fn(() => jest.fn()),
  setBackgroundMessageHandler: jest.fn(),
}));

// Notifee: o modulo nativo (NotifeeNativeModule) lanca no construtor quando nao
// existe em Node. O mock oficial substitui a API por jest.fn() e re-exporta os
// enums (AndroidImportance, TriggerType, EventType, etc.) que o codigo de alarme
// usa. Sem isso, qualquer teste que carregue a arvore de navegacao quebra no
// import de '@notifee/react-native' (via features/medications/alarms).
jest.mock('@notifee/react-native', () =>
  require('@notifee/react-native/jest-mock'),
);

// react-native-track-player: usa NativeEventEmitter no import, que lanca em
// Node (modulo nativo ausente). Mocka a API + os enums usados pelo Modo Soninho.
jest.mock('react-native-track-player', () => ({
  __esModule: true,
  default: {
    setupPlayer: jest.fn(async () => undefined),
    updateOptions: jest.fn(async () => undefined),
    setRepeatMode: jest.fn(async () => undefined),
    reset: jest.fn(async () => undefined),
    add: jest.fn(async () => undefined),
    setVolume: jest.fn(async () => undefined),
    play: jest.fn(async () => undefined),
    pause: jest.fn(async () => undefined),
    registerPlaybackService: jest.fn(),
    addEventListener: jest.fn(),
  },
  Capability: { Play: 'play', Pause: 'pause', Stop: 'stop' },
  RepeatMode: { Off: 0, Track: 1, Queue: 2 },
  AppKilledPlaybackBehavior: {
    ContinuePlayback: 'continue',
    StopPlaybackAndRemoveNotification: 'stop',
  },
  Event: {
    RemotePlay: 'remote-play',
    RemotePause: 'remote-pause',
    RemoteStop: 'remote-stop',
  },
}));

// Gesture handler ja vem com jestSetup mas precisa ser carregado
require('react-native-gesture-handler/jestSetup');
