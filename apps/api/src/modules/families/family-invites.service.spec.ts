import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvatarStyle } from '../../common/enums/avatar-style.enum';
import { FamilyInviteStatus } from '../../common/enums/family-invite-status.enum';
import { User } from '../users/entities/user.entity';
import { FamilyInvite } from './entities/family-invite.entity';
import { FamilyInvitesService } from './family-invites.service';

const DAY_MS = 86400 * 1000;

// Mock factories — mantidas locais ao arquivo pra facilitar a leitura.
function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'mguib@example.com',
    name: 'Mguib',
    passwordHash: '',
    fcmToken: null,
    avatarStyle: AvatarStyle.ADVENTURER,
    avatarSeed: 'mguib',
    familyId: 'family-1',
    family: undefined as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as User;
}

function buildInvite(overrides: Partial<FamilyInvite> = {}): FamilyInvite {
  return {
    id: 'invite-1',
    code: '123456',
    familyId: 'family-1',
    family: undefined as any,
    createdByUserId: 'user-1',
    createdByUser: undefined as any,
    status: FamilyInviteStatus.PENDING,
    expiresAt: new Date(Date.now() + 7 * DAY_MS),
    acceptedByUserId: null,
    acceptedByUser: null,
    acceptedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as FamilyInvite;
}

describe('FamilyInvitesService', () => {
  let service: FamilyInvitesService;
  let invitesRepo: {
    findOne: jest.Mock;
    find: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let usersRepo: { count: jest.Mock };

  beforeEach(async () => {
    invitesRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      count: jest.fn(),
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      createQueryBuilder: jest.fn(),
    };
    usersRepo = { count: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        FamilyInvitesService,
        { provide: getRepositoryToken(FamilyInvite), useValue: invitesRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();

    service = module.get(FamilyInvitesService);
  });

  describe('create', () => {
    it('cria convite PENDING com código de 6 dígitos e validade de 7 dias', async () => {
      usersRepo.count.mockResolvedValue(2); // 2 membros
      invitesRepo.count.mockResolvedValue(1); // 1 pendente (2 + 1 < 4, ok)
      invitesRepo.findOne.mockResolvedValue(null); // código sem colisão

      const before = Date.now();
      const invite = await service.create(buildUser());
      const after = Date.now();

      expect(invite.code).toMatch(/^\d{6}$/);
      expect(invite.familyId).toBe('family-1');
      expect(invite.createdByUserId).toBe('user-1');
      expect(invite.status).toBe(FamilyInviteStatus.PENDING);
      // expiresAt ~= agora + 7 dias (tolerância pro tempo de execução do teste)
      expect(invite.expiresAt.getTime()).toBeGreaterThanOrEqual(before + 7 * DAY_MS);
      expect(invite.expiresAt.getTime()).toBeLessThanOrEqual(after + 7 * DAY_MS);
      expect(invitesRepo.save).toHaveBeenCalled();
    });

    it('BadRequest quando membros + pendentes já atingem o limite de 4', async () => {
      usersRepo.count.mockResolvedValue(3);
      invitesRepo.count.mockResolvedValue(1); // 3 + 1 = 4 -> família cheia

      await expect(service.create(buildUser())).rejects.toThrow(BadRequestException);
      await expect(service.create(buildUser())).rejects.toThrow(/Limite total: 4/);
      expect(invitesRepo.save).not.toHaveBeenCalled();
    });

    it('BadRequest com família de 4 membros mesmo sem nenhum convite pendente', async () => {
      usersRepo.count.mockResolvedValue(4);
      invitesRepo.count.mockResolvedValue(0);

      await expect(service.create(buildUser())).rejects.toThrow(BadRequestException);
    });

    it('BadRequest pela regra de máximo de 3 convites pendentes', async () => {
      // Obs.: com MAX_MEMBERS=4 e pelo menos 1 membro (o criador), a regra de
      // limite total sempre dispara antes desta — na prática este branch só é
      // alcançável com membersCount=0 (estado impossível em produção).
      // Documentamos o comportamento mesmo assim.
      usersRepo.count.mockResolvedValue(0);
      invitesRepo.count.mockResolvedValue(3);

      await expect(service.create(buildUser())).rejects.toThrow(/Cancele um antes de criar outro/);
    });

    it('regera o código quando há colisão com outro PENDING', async () => {
      usersRepo.count.mockResolvedValue(1);
      invitesRepo.count.mockResolvedValue(0);
      // 1ª tentativa colide, 2ª é única
      invitesRepo.findOne.mockResolvedValueOnce(buildInvite()).mockResolvedValueOnce(null);

      const invite = await service.create(buildUser());

      expect(invitesRepo.findOne).toHaveBeenCalledTimes(2);
      expect(invite.code).toMatch(/^\d{6}$/);
    });

    it('desiste após 10 tentativas de gerar código único', async () => {
      usersRepo.count.mockResolvedValue(1);
      invitesRepo.count.mockResolvedValue(0);
      invitesRepo.findOne.mockResolvedValue(buildInvite()); // sempre colide

      await expect(service.create(buildUser())).rejects.toThrow(/código único/);
      expect(invitesRepo.findOne).toHaveBeenCalledTimes(10);
    });
  });

  describe('revoke', () => {
    it('marca o convite como REVOKED e salva', async () => {
      const invite = buildInvite();
      invitesRepo.findOne.mockResolvedValue(invite);

      await service.revoke('invite-1', buildUser());

      expect(invite.status).toBe(FamilyInviteStatus.REVOKED);
      expect(invitesRepo.save).toHaveBeenCalledWith(invite);
    });

    it('NotFound quando o convite não existe', async () => {
      invitesRepo.findOne.mockResolvedValue(null);

      await expect(service.revoke('ghost', buildUser())).rejects.toBeInstanceOf(NotFoundException);
    });

    it('Forbidden quando o convite é de outra família', async () => {
      invitesRepo.findOne.mockResolvedValue(buildInvite({ familyId: 'family-2' }));

      await expect(service.revoke('invite-1', buildUser())).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(invitesRepo.save).not.toHaveBeenCalled();
    });

    it('BadRequest quando o convite não está mais PENDING', async () => {
      invitesRepo.findOne.mockResolvedValue(buildInvite({ status: FamilyInviteStatus.ACCEPTED }));

      await expect(service.revoke('invite-1', buildUser())).rejects.toThrow(BadRequestException);
    });
  });

  describe('expirePendingPastDue (job de cleanup)', () => {
    // Monta a cadeia do query builder de UPDATE usada pelo método.
    function mockUpdateQueryBuilder(executeResult: { affected?: number }) {
      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue(executeResult),
      };
      invitesRepo.createQueryBuilder.mockReturnValue(qb);
      return qb;
    }

    it('marca PENDING vencidos como EXPIRED e retorna a quantidade afetada', async () => {
      const qb = mockUpdateQueryBuilder({ affected: 3 });

      const affected = await service.expirePendingPastDue();

      expect(affected).toBe(3);
      expect(qb.set).toHaveBeenCalledWith({ status: FamilyInviteStatus.EXPIRED });
      // Só PENDING entra no filtro — ACCEPTED/REVOKED nunca viram EXPIRED.
      expect(qb.where).toHaveBeenCalledWith('status = :pending', {
        pending: FamilyInviteStatus.PENDING,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('expires_at < :now', {
        now: expect.any(Date),
      });
    });

    it('retorna 0 quando o driver não informa linhas afetadas', async () => {
      mockUpdateQueryBuilder({ affected: undefined });

      await expect(service.expirePendingPastDue()).resolves.toBe(0);
    });
  });
});
