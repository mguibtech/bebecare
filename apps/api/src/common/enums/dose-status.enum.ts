// Estado de uma dose esperada.
//  - PENDING: criada pelo cron (ou ad-hoc), ainda não marcada
//  - TAKEN: usuário confirmou que o bebê tomou
//  - SKIPPED: usuário marcou que pulou (com motivo opcional)
export enum DoseStatus {
  PENDING = 'pending',
  TAKEN = 'taken',
  SKIPPED = 'skipped',
}
