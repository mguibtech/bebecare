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
  /** True se este membro eh o usuario autenticado. */
  isMe: boolean;
};

export type Invite = {
  id: string;
  /** Codigo de 6 digitos para compartilhar. */
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
  /** Nome da familia. Null = sem nome customizado. */
  name: string | null;
  /** Todos os membros (inclui o usuario atual com isMe=true). */
  members: FamilyMember[];
  /** Convites ativos e nao expirados. */
  pendingInvites: Invite[];
  /** Limite soft de membros (4 na V1). */
  maxMembers: number;
};

// ----- Bodies (request) -----

export type UpdateFamilyBody = {
  /** Passar null pra limpar. Omitir = sem mudanca. */
  name?: string | null;
};
