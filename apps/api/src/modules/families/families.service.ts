import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Family) private readonly families: Repository<Family>,
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  // Cria uma família vazia (sem membros ainda). O AuthService chama isso antes
  // de criar o usuário no registro, dentro da mesma transação.
  async create(manager?: EntityManager, name: string | null = null): Promise<Family> {
    const repo = manager ? manager.getRepository(Family) : this.families;
    const family = repo.create({ name });
    return repo.save(family);
  }

  // Busca a família completa com seus membros — usado pelo /auth/me para
  // devolver a lista de cuidadores junto com o user atual.
  async findByIdWithMembers(familyId: string): Promise<Family | null> {
    return this.families.findOne({
      where: { id: familyId },
      relations: { members: true },
    });
  }

  // Retorna os "outros membros" da família — todo user que NÃO é o atual.
  // Útil para o /auth/me decidir quem é o "parceiro/parente" a exibir no header.
  async findOtherMembers(familyId: string, currentUserId: string): Promise<User[]> {
    const family = await this.findByIdWithMembers(familyId);
    if (!family) return [];
    return family.members.filter((u) => u.id !== currentUserId);
  }
}
