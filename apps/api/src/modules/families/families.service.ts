import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FamiliesService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
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

  // Busca a família completa com seus membros — usado pelo /auth/me e pelo
  // GET /families/me para devolver a lista de cuidadores.
  async findByIdWithMembers(familyId: string): Promise<Family | null> {
    return this.families.findOne({
      where: { id: familyId },
      relations: { members: true },
    });
  }

  // Renomeia a família. Qualquer membro pode renomear.
  async updateName(familyId: string, name: string | null): Promise<Family> {
    const family = await this.families.findOne({ where: { id: familyId } });
    if (!family) {
      throw new NotFoundException('Família não encontrada');
    }

    const trimmed = name?.trim();
    family.name = trimmed && trimmed.length > 0 ? trimmed : null;
    return this.families.save(family);
  }

  // Move um user para uma família solo nova. Implementa as duas operações:
  //  - "Sair" (currentUser sai)
  //  - "Remover membro" (admin remove outro membro)
  // Em ambos os casos, o user removido não fica sem família — ele ganha uma nova vazia.
  // Bebês permanecem com a família original (com quem fica).
  async moveUserToNewSoloFamily(userId: string): Promise<Family> {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User);
      const familyRepo = manager.getRepository(Family);

      const user = await userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      const newFamily = familyRepo.create({ name: null });
      await familyRepo.save(newFamily);

      user.familyId = newFamily.id;
      await userRepo.save(user);

      return newFamily;
    });
  }

  // Operação "sair da família" (POST /families/me/leave).
  // Só permite se a família tiver 2+ membros — usuário solo não tem o que
  // sair. Para encerrar uso, deve excluir a conta.
  async leaveFamily(currentUser: User): Promise<Family> {
    const membersCount = await this.users.count({
      where: { familyId: currentUser.familyId },
    });

    if (membersCount < 2) {
      throw new BadRequestException(
        'Você é o único membro da família. Para encerrar o uso, exclua sua conta em vez de sair.',
      );
    }

    return this.moveUserToNewSoloFamily(currentUser.id);
  }

  // Operação "remover membro" (DELETE /families/me/members/:userId).
  // Qualquer membro pode remover outro (decisão de produto: família opera em conjunto).
  async removeMember(memberId: string, currentUser: User): Promise<void> {
    if (memberId === currentUser.id) {
      throw new BadRequestException('Para sair da própria família, use POST /families/me/leave');
    }

    const member = await this.users.findOne({ where: { id: memberId } });
    if (!member) {
      throw new NotFoundException('Membro não encontrado');
    }

    if (member.familyId !== currentUser.familyId) {
      throw new ForbiddenException('Membro não pertence à sua família');
    }

    await this.moveUserToNewSoloFamily(memberId);
  }
}
