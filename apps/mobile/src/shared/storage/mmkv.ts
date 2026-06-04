import { MMKV } from 'react-native-mmkv';

/**
 * Storage rapido sincrono para preferencias do usuário e cache leve.
 * NAO usar para segredos (use secureStorage).
 *
 * Padrao: instancia unica com id 'bebecare'. Para particionar
 * (ex: por usuário logado) criar instancias adicionais com id distinto.
 */
export const storage = new MMKV({ id: 'bebecare' });

/**
 * Helpers tipados para evitar repeticao de get/set boilerplate.
 */
export const kv = {
  getString(key: string): string | undefined {
    return storage.getString(key);
  },
  setString(key: string, value: string): void {
    storage.set(key, value);
  },
  getNumber(key: string): number | undefined {
    return storage.getNumber(key);
  },
  setNumber(key: string, value: number): void {
    storage.set(key, value);
  },
  getBool(key: string): boolean | undefined {
    return storage.getBoolean(key);
  },
  setBool(key: string, value: boolean): void {
    storage.set(key, value);
  },
  getJson<T>(key: string): T | undefined {
    const raw = storage.getString(key);
    if (!raw) {
      return undefined;
    }
    try {
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  },
  setJson<T>(key: string, value: T): void {
    storage.set(key, JSON.stringify(value));
  },
  remove(key: string): void {
    storage.delete(key);
  },
  clearAll(): void {
    storage.clearAll();
  },
};
