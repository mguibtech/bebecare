import * as Keychain from 'react-native-keychain';

/**
 * Wrapper sobre react-native-keychain para guardar segredos
 * (JWT, refresh token). Usa Keystore (Android) / Keychain (iOS).
 *
 * NAO usar pra dados nao-sensiveis: prefira MMKV (rapido, sincrono).
 */

const SERVICE = 'com.bebecare.auth';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export const secureStorage = {
  async saveTokens(tokens: AuthTokens): Promise<void> {
    await Keychain.setGenericPassword(
      tokens.accessToken,
      tokens.refreshToken,
      { service: SERVICE },
    );
  },

  async loadTokens(): Promise<AuthTokens | null> {
    const result = await Keychain.getGenericPassword({ service: SERVICE });
    if (!result) {
      return null;
    }
    return {
      accessToken: result.username,
      refreshToken: result.password,
    };
  },

  async clearTokens(): Promise<void> {
    await Keychain.resetGenericPassword({ service: SERVICE });
  },
};
