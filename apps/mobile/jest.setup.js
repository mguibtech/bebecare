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

// Gesture handler ja vem com jestSetup mas precisa ser carregado
require('react-native-gesture-handler/jestSetup');
