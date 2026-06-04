/**
 * Tipos do dominio Family no mobile, espelhando os DTOs do backend.
 *  - FamilyDetailsDto, FamilyMemberDto, InviteResponseDto
 *  - FamilyInviteStatus enum
 */

import { AvatarStyle } from '@/features/auth/types';

// Status do convite (espelha enum do backend).
export enum FamilyInviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
}

export type FamilyMember = {
  id: string;
  name: string;
  avatarStyle: AvatarStyle;
  avatarSeed: string;
  /** True se este membro eh o usuário autenticado. */
  isMe: boolean;
};

export type Invite = {
  id: string;
  /** Código de 6 digitos para compartilhar. */
  code: string;
  status: FamilyInviteStatus;
  /** ISO date-time. */
  expiresAt: string;
  /** ISO date-time. */
  createdAt: string;
  /** Nome de quem criou o convite. */
  createdByName: string;
};

export type FamilyDetails = {
  id: string;
  /** Nome da família. Null = sem nome customizado. */
  name: string | null;
  /** Todos os membros (inclui o usuário atual com isMe=true). */
  members: FamilyMember[];
  /** Convites ativos e não expirados. */
  pendingInvites: Invite[];
  /** Limite soft de membros (4 na V1). */
  maxMembers: number;
};

// ----- Bodies (request) -----

export type UpdateFamilyBody = {
  /** Passar null pra limpar. Omitir = sem mudanca. */
  name?: string | null;
};
