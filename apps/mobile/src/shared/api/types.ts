/**
 * Tipos compartilhados pela camada HTTP.
 */

export type ApiErrorPayload = {
  statusCode: number;
  message: string | string[];
  error?: string;
};

/**
 * Erro normalizado lancado pelo apiClient quando a API responde >= 400.
 * Componentes/hooks devem capturar isso ao inves de raw AxiosError.
 */
export class ApiError extends Error {
  public readonly status: number;
  public readonly payload?: ApiErrorPayload;

  constructor(message: string, status: number, payload?: ApiErrorPayload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}
