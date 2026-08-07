import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { AvatarStyle } from '../../common/enums/avatar-style.enum';
import { User } from '../users/entities/user.entity';
import { Family } from './entities/family.entity';
import { FamiliesService } from './families.service';

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

function buildFamily(overrides: Partial<Family> = {}): Family {
  return {
    id: 'family-1',
    name: null,
    members: [],
    babies: [],
    invites: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as Family;
}

describe('FamiliesService', () => {
  let service: FamiliesService;
  let familiesRepo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock };
  let usersRepo: { count: jest.Mock; findOne: jest.Mock };

  // Repositórios "de dentro da transação" — moveUserToNewSoloFamily usa
  // manager.getRepository(User|Family) em vez dos repositórios injetados.
  let txUserRepo: { findOne: jest.Mock; save: jest.Mock };
  let txFamilyRepo: { create: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    familiesRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      findOne: jest.fn(),
    };
    usersRepo = { count: jest.fn(), findOne: jest.fn() };
    txUserRepo = { findOne: jest.fn(), save: jest.fn(async (x) => x) };
    txFamilyRepo = {
      create: jest.fn((x) => ({ id: 'family-new', ...x })),
      save: jest.fn(async (x) => x),
    };

    const fakeManager = {
      getRepository: jest.fn((entity: unknown) => (entity === User ? txUserRepo : txFamilyRepo)),
    };
    const fakeDataSource = {
      transaction: jest.fn((cb: (manager: any) => Promise<unknown>) => cb(fakeManager)),
    };

    const module = await Test.createTestingModule({
      providers: [
        FamiliesService,
        { provide: getDataSourceToken(), useValue: fakeDataSource },
        { provide: getRepositoryToken(Family), useValue: familiesRepo },
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();

    service = module.get(FamiliesService);
  });

  describe('create', () => {
    it('sem manager: cria família vazia (name null) pelo repositório injetado', async () => {
      const family = await service.create();

      expect(familiesRepo.create).toHaveBeenCalledWith({ name: null });
      expect(familiesRepo.save).toHaveBeenCalled();
      expect(family.name).toBeNull();
    });

    it('com manager: usa o repositório da transação (não o injetado)', async () => {
      // O AuthService.register passa o manager pra criar Family + User atomicamente.
      const fakeManager = {
        getRepository: jest.fn(() => txFamilyRepo),
      };

      await service.create(fakeManager as any, 'Família Silva');

      expect(txFamilyRepo.create).toHaveBeenCalledWith({ name: 'Família Silva' });
      expect(txFamilyRepo.save).toHaveBeenCalled();
      expect(familiesRepo.create).not.toHaveBeenCalled();
      expect(familiesRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateName', () => {
    it('aplica trim no nome antes de salvar', async () => {
      familiesRepo.findOne.mockResolvedValue(buildFamily());

      const updated = await service.updateName('family-1', '  Família Silva  ');

      expect(updated.name).toBe('Família Silva');
      expect(familiesRepo.save).toHaveBeenCalled();
    });

    it('nome vazio ou só espaços limpa o nome (vira null)', async () => {
      familiesRepo.findOne.mockResolvedValue(buildFamily({ name: 'Antigo' }));

      const updated = await service.updateName('family-1', '   ');

      expect(updated.name).toBeNull();
    });

    it('lança NotFound quando a família não existe', async () => {
      familiesRepo.findOne.mockResolvedValue(null);

      await expect(service.updateName('nope', 'X')).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('moveUserToNewSoloFamily', () => {
    it('cria família nova vazia e reaponta o familyId do user pra ela', async () => {
      const user = buildUser({ familyId: 'family-old' });
      txUserRepo.findOne.mockResolvedValue(user);

      const newFamily = await service.moveUserToNewSoloFamily('user-1');

      // A família nova nasce sem nome — e os bebês NÃO acompanham o user
      // (ficam com a família original; o service nem toca em Baby).
      expect(txFamilyRepo.create).toHaveBeenCalledWith({ name: null });
      expect(newFamily.id).toBe('family-new');
      expect(user.familyId).toBe('family-new');
      expect(txUserRepo.save).toHaveBeenCalledWith(user);
    });

    it('lança NotFound quando o user não existe', async () => {
      txUserRepo.findOne.mockResolvedValue(null);

      await expect(service.moveUserToNewSoloFamily('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('leaveFamily', () => {
    it('com 2+ membros: move o user pra uma família solo nova', async () => {
      const currentUser = buildUser();
      usersRepo.count.mockResolvedValue(2);
      txUserRepo.findOne.mockResolvedValue(currentUser);

      const newFamily = await service.leaveFamily(currentUser);

      expect(usersRepo.count).toHaveBeenCalledWith({ where: { familyId: 'family-1' } });
      expect(newFamily.id).toBe('family-new');
      expect(currentUser.familyId).toBe('family-new');
    });

    it('único membro: BadRequest orientando excluir a conta em vez de sair', async () => {
      usersRepo.count.mockResolvedValue(1);

      await expect(service.leaveFamily(buildUser())).rejects.toThrow(BadRequestException);
      await expect(service.leaveFamily(buildUser())).rejects.toThrow(/exclua sua conta/);
      // Não deve nem iniciar a transação de mover o user.
      expect(txFamilyRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('removeMember', () => {
    it('remover a si mesmo: BadRequest apontando pro fluxo de leave', async () => {
      const me = buildUser({ id: 'user-1' });

      await expect(service.removeMember('user-1', me)).rejects.toThrow(BadRequestException);
      await expect(service.removeMember('user-1', me)).rejects.toThrow(/leave/);
    });

    it('membro inexistente: NotFound', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await expect(service.removeMember('ghost', buildUser())).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('membro de outra família: Forbidden', async () => {
      usersRepo.findOne.mockResolvedValue(buildUser({ id: 'other', familyId: 'family-2' }));

      await expect(service.removeMember('other', buildUser())).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(txFamilyRepo.create).not.toHaveBeenCalled();
    });

    it('membro da mesma família: movido pra família solo nova', async () => {
      const member = buildUser({ id: 'partner', familyId: 'family-1' });
      usersRepo.findOne.mockResolvedValue(member);
      txUserRepo.findOne.mockResolvedValue(member);

      await service.removeMember('partner', buildUser({ id: 'user-1' }));

      expect(member.familyId).toBe('family-new');
      expect(txUserRepo.save).toHaveBeenCalledWith(member);
    });
  });
});
