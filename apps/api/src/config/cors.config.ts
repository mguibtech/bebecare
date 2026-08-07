import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Define uma política CORS segura para cada ambiente.
 *
 * O app React Native não envia o header Origin, portanto não precisa de CORS
 * para acessar a API. Em produção, só liberamos origens web explicitamente
 * cadastradas em CORS_ALLOWED_ORIGINS. Sem a variável, nenhum browser externo
 * recebe headers CORS.
 */
export function resolveCorsOptions(environment: NodeJS.ProcessEnv = process.env): CorsOptions {
  if (environment.NODE_ENV !== 'production') {
    return {
      origin: true,
      credentials: true,
    };
  }

  const allowedOrigins = Array.from(
    new Set(
      (environment.CORS_ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  );

  if (allowedOrigins.length === 0) {
    return { origin: false };
  }

  return {
    origin: allowedOrigins,
    credentials: true,
    maxAge: 86_400,
  };
}
