// Carga de uma push notification, independente do provedor (FCM, APNs, etc.).
// Campos batem com o que o FCM aceita em `notification` + `data`:
//  - title/body são o que aparece na tela de bloqueio do device.
//  - data é payload opcional para o app abrir uma tela específica
//    quando o usuário tocar (ex.: { type: 'appointment', id: 'uuid-...' }).
export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}
