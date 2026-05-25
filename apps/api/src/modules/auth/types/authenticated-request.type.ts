import { Request } from 'express';
import { User } from '../../users/entities/user.entity';

// Request com o usuário autenticado anexado pelo JwtStrategy.
// Usado pelo decorator @CurrentUser() para extrair o user com segurança de tipo.
export interface AuthenticatedRequest extends Request {
  user: User;
}
