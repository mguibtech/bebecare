import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { AvatarStyle } from '../../common/enums/avatar-style.enum';

// Dados para criar um novo user. A senha já chega como HASH (responsabilidade
// do AuthService criptografar antes de chamar create).
export interface CreateUserData {
  email: string;
  name: string;
  passwordHash: string;
  familyId: string;
  avatarStyle?: AvatarStyle;
  avatarSeed?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  // Cria um usuário. Aceita um EntityManager opcional para participar de
  // transações iniciadas em outro service (ex.: AuthService.register cria
  // Family + User numa única transação).
  async create(data: CreateUserData, manager?: EntityManager): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.users;

    const user = repo.create({
      email: data.email.toLowerCase().trim(),
      name: data.name.trim(),
      passwordHash: data.passwordHash,
      familyId: data.familyId,
      avatarStyle: data.avatarStyle ?? AvatarStyle.ADVENTURER,
      // Default da seed: parte do email antes do @, com fallback pro nome.
      avatarSeed:
        data.avatarSeed?.trim() ||
        data.email.split('@')[0]?.toLowerCase() ||
        data.name.toLowerCase().replace(/\s+/g, '-'),
    });

    return repo.save(user);
  }

  // Busca por email. Por padrão NÃO traz o passwordHash (graças ao select:false
  // na entity). Para login, passar `withPasswordHash = true`.
  async findByEmail(email: string, withPasswordHash = false): Promise<User | null> {
    const normalized = email.toLowerCase().trim();

    if (!withPasswordHash) {
      return this.users.findOne({ where: { email: normalized } });
    }

    return this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email: normalized })
      .getOne();
  }

  // Busca por id. Usado pelo JwtStrategy para hidratar o usuário a partir do token.
  async findById(id: string): Promise<User | null> {
    return this.users.findOne({ where: { id } });
  }

  // Atualiza o FCM token (Push notifications) — útil em login/refresh do mobile.
  async updateFcmToken(userId: string, fcmToken: string | null): Promise<void> {
    await this.users.update({ id: userId }, { fcmToken });
  }
}
