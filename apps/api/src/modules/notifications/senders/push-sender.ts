import { PushPayload } from '../interfaces/push-payload.interface';

// Token de DI para o provedor de push. NotificationsService depende dessa
// interface, não da implementação concreta — assim os testes injetam o
// StubSender (que captura chamadas em memória) sem precisar mockar firebase-admin.
export const PUSH_SENDER = Symbol('PUSH_SENDER');

// Resultado por token enviado. Permite ao NotificationsService limpar
// fcm_tokens inválidos quando o provedor diz que o device não existe mais.
export interface PushSendResult {
  token: string;
  success: boolean;
  // Quando false: motivo. 'invalid-token' é o caso que aciona limpeza no DB.
  errorCode?: 'invalid-token' | 'rate-limited' | 'unknown';
  errorMessage?: string;
}

export interface PushSender {
  // Envia o mesmo payload para múltiplos tokens. Implementações devem
  // retornar UM resultado por token, na MESMA ordem da entrada.
  sendToTokens(tokens: string[], payload: PushPayload): Promise<PushSendResult[]>;
}
