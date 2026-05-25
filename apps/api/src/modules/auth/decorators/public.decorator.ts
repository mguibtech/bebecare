import { SetMetadata } from '@nestjs/common';

// Marca uma rota como pública (sem JWT). Combinado com o JwtAuthGuard global
// no AppModule, isso é o que permite o /auth/register, /auth/login e /api/health
// continuarem acessíveis sem token.
//
// Uso:
//   @Public()
//   @Post('login')
//   login(...) { ... }
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
