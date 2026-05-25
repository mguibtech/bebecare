// Estado de um convite para entrar na família.
//  - PENDING: aguardando ser usado, dentro do prazo
//  - ACCEPTED: alguém usou o código e entrou na família
//  - EXPIRED: passou da data de expiração (7 dias por padrão)
//  - REVOKED: criador cancelou manualmente antes da expiração
export enum FamilyInviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}
