/**
 * Guarda de configuração do Firebase.
 *
 * O @react-native-firebase/app auto-inicializa o app [DEFAULT] no boot nativo
 * a partir do google-services.json (Android) / GoogleService-Info.plist (iOS).
 * Quando esses arquivos NAO existem (dev ainda não configurou o projeto no
 * Firebase console — ver M6/6A), não ha app default e qualquer chamada a
 * messaging() lanca excecao.
 *
 * `isFirebaseConfigured()` permite que todo o código de push seja no-op nesse
 * cenario, mantendo o app rodando normalmente (push apenas inativo) ate o
 * arquivo de credenciais chegar.
 */

import { getApps } from '@react-native-firebase/app';

export function isFirebaseConfigured(): boolean {
  try {
    return getApps().length > 0;
  } catch {
    return false;
  }
}
