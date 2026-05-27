/**
 * Camada HTTP do dominio babies.
 *
 * Endpoints (todos protegidos por JWT — apiClient injeta header):
 *   GET    /babies        lista da familia do user
 *   POST   /babies        cria bebe
 *   GET    /babies/:id    detalhe (precisa ser da familia)
 *   PATCH  /babies/:id    update parcial
 *   DELETE /babies/:id    soft-delete (recuperavel 30 dias)
 *
 * Erros sao normalizados como ApiError pelo interceptor. 401 dispara
 * refresh automatico; 403 = bebe de outra familia; 404 = nao existe.
 */

import { apiClient } from '@/shared/api/client';

import type { Baby, CreateBabyBody, UpdateBabyBody } from '../types';

export const babiesApi = {
  /** GET /babies — lista da familia (ordenado por createdAt asc no backend). */
  async list(): Promise<Baby[]> {
    const { data } = await apiClient.get<Baby[]>('/babies');
    return data;
  },

  /** GET /babies/:id */
  async getOne(id: string): Promise<Baby> {
    const { data } = await apiClient.get<Baby>(`/babies/${id}`);
    return data;
  },

  /** POST /babies */
  async create(body: CreateBabyBody): Promise<Baby> {
    const { data } = await apiClient.post<Baby>('/babies', body);
    return data;
  },

  /** PATCH /babies/:id — campos parciais. */
  async update(id: string, body: UpdateBabyBody): Promise<Baby> {
    const { data } = await apiClient.patch<Baby>(`/babies/${id}`, body);
    return data;
  },

  /**
   * DELETE /babies/:id — soft-delete. Bebe some das queries futuras, mas
   * fica recuperavel no banco por 30 dias antes de purge real.
   */
  async remove(id: string): Promise<void> {
    await apiClient.delete(`/babies/${id}`);
  },
};
