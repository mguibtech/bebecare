/**
 * Tipos do dominio de autenticacao no mobile.
 * Espelham os DTOs do backend (apps/api/src/modules/auth/dto/*.ts).
 *
 * Se algo aqui divergir do backend, e bug — ajustar este arquivo,
 * NUNCA fazer cast por cima.
 */

// Mantido em sincronia com apps/api/src/common/enums/avatar-style.enum.ts
export enum AvatarStyle {
  ADVENTURER = 'adventurer',
  LORELEI = 'lorelei',
  MICAH = 'micah',
  PERSONAS = 'personas',
  NOTIONISTS = 'notionists',
  AVATAAARS = 'avataaars',
  BOTTTS = 'bottts',
  CROODLES = 'croodles',
}

/** Usuario na forma "publica" (sem passwordHash, fcmToken, etc.) */
export type UserPublic = {
  id: string;
  email: string;
  name: string;
  avatarStyle: AvatarStyle;
  avatarSeed: string;
  familyId: string;
};

/** Membro da familia exibido em /auth/me (sem email/dados privados). */
export type FamilyMemberPublic = {
  id: string;
  name: string;
  avatarStyle: AvatarStyle;
  avatarSeed: string;
};

export type FamilySummary = {
  id: string;
  name: string | null;
  /** Nao inclui o usuario atual. */
  members: FamilyMemberPublic[];
};

/**
 * Resposta de POST /auth/register, /auth/login e /auth/refresh.
 */
export type AuthResponse = {
  user: UserPublic;
  accessToken: string;
  refreshToken: string;
  /** Segundos ate o accessToken expirar (ex.: 900 = 15min). */
  expiresIn: number;
};

/** Resposta de GET /auth/me (sem tokens). */
export type MeResponse = {
  user: UserPublic;
  family: FamilySummary;
};

// ---------- Bodies (request) ----------

export type LoginBody = {
  email: string;
  password: string;
};

export type RegisterBody = {
  email: string;
  name: string;
  password: string;
  /** Codigo de 6 digitos opcional para entrar em familia existente. */
  inviteCode?: string;
};

export type RefreshBody = {
  refreshToken: string;
};

/** PATCH /users/me — edita nome e/ou avatar. Todos opcionais. */
export type UpdateProfileBody = {
  name?: string;
  avatarStyle?: AvatarStyle;
  avatarSeed?: string;
};

// ---------- Erros conhecidos da camada auth ----------

/**
 * Mensagens mais provaveis vindas do backend. Sao usadas para mapear erros
 * comuns para UX amigavel; nao sao um enum exaustivo.
 */
export const AUTH_ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'Email ou senha invalidos',
  EMAIL_TAKEN: 'Esse email ja esta cadastrado',
  INVALID_INVITE: 'Codigo de convite invalido ou expirado',
} as const;
