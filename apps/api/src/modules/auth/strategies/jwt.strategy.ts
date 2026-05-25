import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { User } from '../../users/entities/user.entity';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../types/jwt-payload.type';

// Strategy do Passport para validar JWT no header Authorization: Bearer <token>.
// Após validar a assinatura e o tempo, busca o usuário no banco e anexa ao request.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // Chamado pelo Passport com o payload já decodificado e verificado.
  // O retorno desta função é o que vira `request.user`.
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      // User foi soft-deleted ou nunca existiu — token "válido" mas dono não existe.
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return user;
  }
}
