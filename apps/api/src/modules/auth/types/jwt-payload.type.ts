// Estrutura do payload do JWT de access.
// Mantém o payload mínimo: só o sub (subject = user id). Para identidade
// completa, o JwtStrategy hidrata o user a partir do banco.
export interface JwtPayload {
  sub: string; // userId
  iat?: number;
  exp?: number;
}
