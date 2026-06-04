/**
 * Camada HTTP do dominio Family.
 *
 * Endpoints (todos protegidos por JWT):
 *   GET    /families/me                       detalhes + convites
 *   PATCH  /families/me                       renomeia (body: { name: string | null })
 *   GET    /families/me/invites               lista pendentes
 *   POST   /families/me/invites               gera convite (código 6 digitos, 7 dias)
 *   DELETE /families/me/invites/:id           revoga
 *   POST   /families/me/leave                 sai da família (cria nova solo)
 *   DELETE /families/me/members/:userId       remove outro membro
 */

import { apiClient } from '@/shared/api/client';

import type { FamilyDetails, Invite, UpdateFamilyBody } from '../types';

export const familyApi = {
  /** GET /families/me */
  async getMe(): Promise<FamilyDetails> {
    const { data } = await apiClient.get<FamilyDetails>('/families/me');
    return data;
  },

  /** PATCH /families/me */
  async update(body: UpdateFamilyBody): Promise<FamilyDetails> {
    const { data } = await apiClient.patch<FamilyDetails>('/families/me', body);
    return data;
  },

  /** GET /families/me/invites */
  async listInvites(): Promise<Invite[]> {
    const { data } = await apiClient.get<Invite[]>('/families/me/invites');
    return data;
  },

  /** POST /families/me/invites */
  async createInvite(): Promise<Invite> {
    const { data } = await apiClient.post<Invite>('/families/me/invites');
    return data;
  },

  /** DELETE /families/me/invites/:id */
  async revokeInvite(id: string): Promise<void> {
    await apiClient.delete(`/families/me/invites/${id}`);
  },

  /**
   * POST /families/me/leave — sai da família atual.
   * Cria uma nova família solo pro user. Falha (400) se for o unico membro.
   * Apos sucesso, mobile DEVE invalidar /auth/me — familyId mudou.
   */
  async leave(): Promise<void> {
    await apiClient.post('/families/me/leave');
  },

  /** DELETE /families/me/members/:userId — remove outro membro. */
  async removeMember(userId: string): Promise<void> {
    await apiClient.delete(`/families/me/members/${userId}`);
  },
};
