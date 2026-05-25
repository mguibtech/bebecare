import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Family } from '../families/entities/family.entity';
import { Baby } from '../babies/entities/baby.entity';
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
    @InjectDataSource() private readonly dataSource: DataSource,
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

  // Atualiza nome e/ou avatar do usuário.
  // Cada campo é opcional — só atualiza os enviados. Retorna o user atualizado.
  async updateProfile(
    userId: string,
    data: { name?: string; avatarStyle?: User['avatarStyle']; avatarSeed?: string },
  ): Promise<User> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    if (data.name !== undefined) user.name = data.name.trim();
    if (data.avatarStyle !== undefined) user.avatarStyle = data.avatarStyle;
    if (data.avatarSeed !== undefined && data.avatarSeed.trim()) {
      user.avatarSeed = data.avatarSeed.trim().slice(0, 100);
    }

    return this.users.save(user);
  }

  // Exclui a conta do usuário (LGPD).
  //  - Soft-delete do User
  //  - Se ele era o último membro da família, soft-delete da Family + babies
  //  - Refresh tokens NÃO são tocados aqui — o controller chama o
  //    RefreshTokenService.revokeAllForUser depois para invalidar sessões.
  // Tudo numa transação para garantir consistência.
  async deleteAccount(userId: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const familyRepo = manager.getRepository(Family);
      const babyRepo = manager.getRepository(Baby);

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) return; // já apagado, idempotente

      const familyId = user.familyId;

      // Soft-delete do user (preenche deleted_at)
      await userRepo.softRemove(user);

      // Quantos membros ativos restam na família?
      const remaining = await userRepo.count({ where: { familyId } });

      if (remaining === 0) {
        // Família ficou vazia — soft-delete dela + bebês cascateados
        const babies = await babyRepo.find({ where: { familyId } });
        if (babies.length > 0) {
          await babyRepo.softRemove(babies);
        }

        const family = await familyRepo.findOne({ where: { id: familyId } });
        if (family) {
          await familyRepo.softRemove(family);
        }
      }
    });
  }
}
