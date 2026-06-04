/**
 * Config do React Native CLI.
 *
 * `assets` aponta pras fontes custom (Nunito + Inter). No Android, os .ttf
 * tambem ja estao copiados em android/app/src/main/assets/fonts (de onde o RN
 * le em runtime). Pra linkar no iOS futuramente, rode `npx react-native-asset`.
 */
module.exports = {
  project: {
    ios: {},
    android: {},
  },
  assets: ['./assets/fonts'],
};
