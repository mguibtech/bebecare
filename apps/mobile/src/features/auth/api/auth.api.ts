/**
 * Camada HTTP do dominio auth.
 *
 * Convencao:
 * - Funcoes finas: 1 chamada axios, retorno tipado, sem regra de negocio.
 * - Erros são normalizados como ApiError pelo interceptor do apiClient.
 * - NAO fazem signIn/signOut — quem decide o que fazer com a resposta são
 *   os hooks (useLogin, useRegister) e o RootNavigator.
 */

import { apiClient } from '@/shared/api/client';
import type {
  AuthResponse,
  LoginBody,
  MeResponse,
  RefreshBody,
  RegisterBody,
  UpdateProfileBody,
  UserPublic,
} from '../types';

export const authApi = {
  /** POST /auth/register — cria conta. Se inviteCode, entra na família existente. */
  async register(body: RegisterBody): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', body);
    return data;
  },

  /** POST /auth/login — autentica e devolve par de tokens. */
  async login(body: LoginBody): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', body);
    return data;
  },

  /**
   * POST /auth/refresh — troca refreshToken por par novo (refresh com rotacao).
   * Importante: o backend inválida o refreshToken antigo, sempre usar o novo.
   *
   * NAO usar diretamente em components — o interceptor do apiClient cuida do
   * fluxo. Exposto aqui pra possiveis usos manuais (ex.: ao boot, se desejar).
   */
  async refresh(body: RefreshBody): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/refresh', body);
    return data;
  },

  /** POST /auth/logout — revoga o refresh token atual (logout deste device). */
  async logout(body: RefreshBody): Promise<void> {
    await apiClient.post('/auth/logout', body);
  },

  /** POST /auth/logout-all — revoga todos os refresh tokens do usuário. */
  async logoutAll(): Promise<void> {
    await apiClient.post('/auth/logout-all');
  },

  /** GET /auth/me — perfil + família do usuário logado. */
  async me(): Promise<MeResponse> {
    const { data } = await apiClient.get<MeResponse>('/auth/me');
    return data;
  },

  /** PATCH /users/me — edita nome e/ou avatar. Retorna o user atualizado. */
  async updateProfile(body: UpdateProfileBody): Promise<UserPublic> {
    const { data } = await apiClient.patch<UserPublic>('/users/me', body);
    return data;
  },

  /**
   * DELETE /users/me — exclui a propria conta (soft-delete, LGPD).
   *
   * Se o user for o unico da família, backend faz cascade: family e bebês
   * também viram soft-delete. Recuperavel em ate 30 dias antes do purge.
   *
   * Apos sucesso, mobile DEVE limpar Keychain + cache (signOut) e voltar pro
   * Login — qualquer request subsequente vai dar 401.
   */
  async deleteAccount(): Promise<void> {
    await apiClient.delete('/users/me');
  },
};
