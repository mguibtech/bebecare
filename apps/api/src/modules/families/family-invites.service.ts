import { randomInt } from 'crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Not, Repository } from 'typeorm';
import { FamilyInviteStatus } from '../../common/enums/family-invite-status.enum';
import { User } from '../users/entities/user.entity';
import { FamilyInvite } from './entities/family-invite.entity';

// Configurações da feature de convites (centralizadas pra ficar fácil ajustar).
const INVITE_CONFIG = {
  // Quantidade máxima de membros por família na V1 (família nuclear estendida).
  MAX_MEMBERS_PER_FAMILY: 4,
  // Quantidade máxima de convites PENDING simultâneos por família.
  MAX_PENDING_PER_FAMILY: 3,
  // Dias até expirar um convite.
  EXPIRES_IN_DAYS: 7,
  // Quantas vezes tentar gerar um código único antes de desistir.
  MAX_CODE_GENERATION_ATTEMPTS: 10,
};

@Injectable()
export class FamilyInvitesService {
  constructor(
    @InjectRepository(FamilyInvite)
    private readonly invites: Repository<FamilyInvite>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  // Gera um código de 6 dígitos único entre os PENDING. Tenta até N vezes
  // — colisão é extremamente improvável com 1M de combinações possíveis e
  // poucos convites simultâneos, mas a defesa em profundidade vale.
  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < INVITE_CONFIG.MAX_CODE_GENERATION_ATTEMPTS; attempt++) {
      const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
      const existing = await this.invites.findOne({
        where: { code, status: FamilyInviteStatus.PENDING },
      });
      if (!existing) return code;
    }
    throw new Error(
      'Não foi possível gerar um código único após várias tentativas — sistema sob carga incomum',
    );
  }

  // Conta quantos PENDING válidos (não expirados) a família tem agora.
  private async countActivePending(familyId: string): Promise<number> {
    return this.invites.count({
      where: {
        familyId,
        status: FamilyInviteStatus.PENDING,
        expiresAt: Not(LessThan(new Date())),
      },
    });
  }

  // Cria um novo convite. Aplica as 2 regras de limite:
  //  - Família não pode passar de MAX_MEMBERS_PER_FAMILY (atual + invites PENDING)
  //  - Família não pode ter mais que MAX_PENDING_PER_FAMILY convites ativos
  async create(currentUser: User): Promise<FamilyInvite> {
    const membersCount = await this.users.count({
      where: { familyId: currentUser.familyId },
    });
    const pendingCount = await this.countActivePending(currentUser.familyId);

    if (membersCount + pendingCount >= INVITE_CONFIG.MAX_MEMBERS_PER_FAMILY) {
      throw new BadRequestException(
        `Sua família já tem ${membersCount} membro(s) e ${pendingCount} convite(s) pendente(s). ` +
          `Limite total: ${INVITE_CONFIG.MAX_MEMBERS_PER_FAMILY}.`,
      );
    }

    if (pendingCount >= INVITE_CONFIG.MAX_PENDING_PER_FAMILY) {
      throw new BadRequestException(
        `Sua família já tem ${pendingCount} convite(s) pendente(s) (limite ${INVITE_CONFIG.MAX_PENDING_PER_FAMILY}). ` +
          'Cancele um antes de criar outro.',
      );
    }

    const code = await this.generateUniqueCode();
    const expiresAt = new Date(
      Date.now() + INVITE_CONFIG.EXPIRES_IN_DAYS * 86400 * 1000,
    );

    const invite = this.invites.create({
      code,
      familyId: currentUser.familyId,
      createdByUserId: currentUser.id,
      status: FamilyInviteStatus.PENDING,
      expiresAt,
    });

    return this.invites.save(invite);
  }

  // Lista convites PENDING válidos da família (ativos e não expirados).
  // Trazemos o created_by_user pra exibir o nome no app.
  async listPendingForFamily(familyId: string): Promise<FamilyInvite[]> {
    return this.invites.find({
      where: {
        familyId,
        status: FamilyInviteStatus.PENDING,
        expiresAt: Not(LessThan(new Date())),
      },
      relations: { createdByUser: true },
      order: { createdAt: 'DESC' },
    });
  }

  // Revoga um convite. Qualquer membro da família pode revogar — alinhado com
  // a decisão de que o casal/família opera em conjunto.
  async revoke(inviteId: string, currentUser: User): Promise<void> {
    const invite = await this.invites.findOne({ where: { id: inviteId } });

    if (!invite) {
      throw new NotFoundException('Convite não encontrado');
    }

    if (invite.familyId !== currentUser.familyId) {
      throw new ForbiddenException('Convite não pertence à sua família');
    }

    if (invite.status !== FamilyInviteStatus.PENDING) {
      throw new BadRequestException(
        `Convite já está ${invite.status} — só PENDING pode ser revogado`,
      );
    }

    invite.status = FamilyInviteStatus.REVOKED;
    await this.invites.save(invite);
  }

  // Usado pelo job de cleanup — marca todos os PENDING vencidos como EXPIRED.
  // Retorna a quantidade atualizada para logging.
  async expirePendingPastDue(): Promise<number> {
    const result = await this.invites
      .createQueryBuilder()
      .update(FamilyInvite)
      .set({ status: FamilyInviteStatus.EXPIRED })
      .where('status = :pending', { pending: FamilyInviteStatus.PENDING })
      .andWhere('expires_at < :now', { now: new Date() })
      .execute();

    return result.affected ?? 0;
  }
}

// Re-export do limite para outros módulos consultarem (ex.: DTOs e UI).
export const FAMILY_LIMITS = {
  MAX_MEMBERS: INVITE_CONFIG.MAX_MEMBERS_PER_FAMILY,
  MAX_PENDING_INVITES: INVITE_CONFIG.MAX_PENDING_PER_FAMILY,
};
