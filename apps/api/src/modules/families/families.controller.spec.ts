import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AvatarStyle } from '../../common/enums/avatar-style.enum';
import { FamilyInviteStatus } from '../../common/enums/family-invite-status.enum';
import { User } from '../users/entities/user.entity';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';
import { FamilyInvite } from './entities/family-invite.entity';
import { FAMILY_LIMITS, FamilyInvitesService } from './family-invites.service';

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
    createdByUserId: 'user-1',
    createdByUser: buildUser(),
    status: FamilyInviteStatus.PENDING,
    expiresAt: new Date('2026-08-14T12:00:00.000Z'),
    acceptedByUserId: null,
    acceptedByUser: null,
    acceptedAt: null,
    createdAt: new Date('2026-08-07T12:00:00.000Z'),
    updatedAt: new Date('2026-08-07T12:00:00.000Z'),
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as FamilyInvite;
}

describe('FamiliesController', () => {
  let controller: FamiliesController;
  let families: { findByIdWithMembers: jest.Mock; updateName: jest.Mock };
  let invites: { listPendingForFamily: jest.Mock };

  beforeEach(async () => {
    families = { findByIdWithMembers: jest.fn(), updateName: jest.fn() };
    invites = { listPendingForFamily: jest.fn().mockResolvedValue([]) };

    const module = await Test.createTestingModule({
      controllers: [FamiliesController],
      providers: [
        { provide: FamiliesService, useValue: families },
        { provide: FamilyInvitesService, useValue: invites },
      ],
    }).compile();

    controller = module.get(FamiliesController);
  });

  describe('getMe', () => {
    it('monta o DTO com membros, convites pendentes e o limite da família', async () => {
      const me = buildUser();
      const other = buildUser({ id: 'user-2', name: 'Mãe', avatarSeed: 'mae' });
      families.findByIdWithMembers.mockResolvedValue({
        id: 'family-1',
        name: 'Família Silva',
        members: [me, other],
      });
      invites.listPendingForFamily.mockResolvedValue([buildInvite()]);

      const dto = await controller.getMe(me);

      expect(dto.name).toBe('Família Silva');
      expect(dto.maxMembers).toBe(FAMILY_LIMITS.MAX_MEMBERS);
      // isMe só no membro logado — o mobile usa isso pra marcar "você".
      expect(dto.members.map((m) => m.isMe)).toEqual([true, false]);
      expect(dto.pendingInvites).toHaveLength(1);
      expect(dto.pendingInvites[0].createdByName).toBe('Mguib');
    });

    it('convite sem createdByUser carregado cai no fallback "desconhecido"', async () => {
      const me = buildUser();
      families.findByIdWithMembers.mockResolvedValue({
        id: 'family-1',
        name: null,
        members: [me],
      });
      invites.listPendingForFamily.mockResolvedValue([
        buildInvite({ createdByUser: undefined as unknown as User }),
      ]);

      const dto = await controller.getMe(me);

      expect(dto.pendingInvites[0].createdByName).toBe('desconhecido');
    });

    it('lança NotFoundException quando a família do user não existe', async () => {
      // Invariante quebrada (todo user tem família): responde 404, não 500.
      families.findByIdWithMembers.mockResolvedValue(null);

      await expect(controller.getMe(buildUser())).rejects.toBeInstanceOf(NotFoundException);
      // Nem chega a buscar convites de uma família inexistente.
      expect(invites.listPendingForFamily).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('renomeia e devolve a visão atualizada', async () => {
      const me = buildUser();
      families.findByIdWithMembers.mockResolvedValue({
        id: 'family-1',
        name: 'Novo Nome',
        members: [me],
      });

      const dto = await controller.update(me, { name: 'Novo Nome' });

      expect(families.updateName).toHaveBeenCalledWith('family-1', 'Novo Nome');
      expect(dto.name).toBe('Novo Nome');
    });

    it('sem name no body não chama updateName (patch parcial)', async () => {
      const me = buildUser();
      families.findByIdWithMembers.mockResolvedValue({
        id: 'family-1',
        name: null,
        members: [me],
      });

      await controller.update(me, {});

      expect(families.updateName).not.toHaveBeenCalled();
    });
  });
});
