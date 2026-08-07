import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { AvatarStyle } from '../../common/enums/avatar-style.enum';
import { Baby } from '../babies/entities/baby.entity';
import { Family } from '../families/entities/family.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

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

describe('UsersService', () => {
  let service: UsersService;
  let usersRepo: { create: jest.Mock; save: jest.Mock; findOne: jest.Mock; update: jest.Mock };

  // Repositórios "de dentro da transação" do deleteAccount.
  let txUserRepo: { findOne: jest.Mock; softRemove: jest.Mock; count: jest.Mock };
  let txFamilyRepo: { findOne: jest.Mock; softRemove: jest.Mock };
  let txBabyRepo: { find: jest.Mock; softRemove: jest.Mock };

  beforeEach(async () => {
    usersRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      findOne: jest.fn(),
      update: jest.fn(),
    };
    txUserRepo = { findOne: jest.fn(), softRemove: jest.fn(), count: jest.fn() };
    txFamilyRepo = { findOne: jest.fn(), softRemove: jest.fn() };
    txBabyRepo = { find: jest.fn(), softRemove: jest.fn() };

    const fakeManager = {
      getRepository: jest.fn((entity: unknown) => {
        if (entity === User) return txUserRepo;
        if (entity === Family) return txFamilyRepo;
        if (entity === Baby) return txBabyRepo;
        throw new Error('Repositório inesperado no teste');
      }),
    };
    const fakeDataSource = {
      transaction: jest.fn((cb: (manager: any) => Promise<unknown>) => cb(fakeManager)),
    };

    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getDataSourceToken(), useValue: fakeDataSource },
        { provide: getRepositoryToken(User), useValue: usersRepo },
      ],
    }).compile();

    service = module.get(UsersService);
  });

  describe('create', () => {
    it('normaliza email, aplica trim no nome e deriva a avatarSeed do email', async () => {
      // A seed default sai do email NORMALIZADO (trim + lowercase), então
      // espaços nas pontas não vazam pra dentro dela.
      await service.create({
        email: '  Novo.Pai@Example.COM  ',
        name: '  Novo Pai  ',
        passwordHash: 'hash',
        familyId: 'family-1',
      });

      expect(usersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'novo.pai@example.com',
          name: 'Novo Pai',
          avatarStyle: AvatarStyle.ADVENTURER, // default
          avatarSeed: 'novo.pai', // parte antes do @, do email normalizado
        }),
      );
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('respeita avatarStyle/avatarSeed explícitos', async () => {
      await service.create({
        email: 'x@example.com',
        name: 'X',
        passwordHash: 'hash',
        familyId: 'family-1',
        avatarStyle: AvatarStyle.BOTTTS,
        avatarSeed: ' robo-1 ',
      });

      expect(usersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ avatarStyle: AvatarStyle.BOTTTS, avatarSeed: 'robo-1' }),
      );
    });

    it('com manager: participa da transação em vez de usar o repositório injetado', async () => {
      // O AuthService.register cria Family + User na mesma transação.
      const managerUserRepo = { create: jest.fn((x) => x), save: jest.fn(async (x) => x) };
      const manager = { getRepository: jest.fn(() => managerUserRepo) };

      await service.create(
        { email: 'x@example.com', name: 'X', passwordHash: 'hash', familyId: 'family-1' },
        manager as any,
      );

      expect(managerUserRepo.save).toHaveBeenCalled();
      expect(usersRepo.create).not.toHaveBeenCalled();
      expect(usersRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('aplica só os campos enviados (com trim no nome)', async () => {
      usersRepo.findOne.mockResolvedValue(buildUser());

      const updated = await service.updateProfile('user-1', { name: '  Mguib Tech  ' });

      expect(updated.name).toBe('Mguib Tech');
      expect(updated.avatarStyle).toBe(AvatarStyle.ADVENTURER); // inalterado
      expect(updated.avatarSeed).toBe('mguib'); // inalterado
      expect(usersRepo.save).toHaveBeenCalled();
    });

    it('avatarSeed vazia é ignorada (não apaga a atual)', async () => {
      usersRepo.findOne.mockResolvedValue(buildUser({ avatarSeed: 'seed-atual' }));

      const updated = await service.updateProfile('user-1', {
        avatarStyle: AvatarStyle.PERSONAS,
        avatarSeed: '   ',
      });

      expect(updated.avatarStyle).toBe(AvatarStyle.PERSONAS);
      expect(updated.avatarSeed).toBe('seed-atual');
    });

    it('rejeita com NotFoundException (404) quando o user não existe', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      // NotFoundException, não Error cru — senão o Nest devolveria 500.
      await expect(service.updateProfile('ghost', { name: 'X' })).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.updateProfile('ghost', { name: 'X' })).rejects.toThrow(
        'Usuário não encontrado',
      );
    });
  });

  describe('deleteAccount', () => {
    it('é idempotente: user já apagado não dispara nenhum soft-delete', async () => {
      txUserRepo.findOne.mockResolvedValue(null);

      await expect(service.deleteAccount('ghost')).resolves.toBeUndefined();

      expect(txUserRepo.softRemove).not.toHaveBeenCalled();
      expect(txFamilyRepo.softRemove).not.toHaveBeenCalled();
      expect(txBabyRepo.softRemove).not.toHaveBeenCalled();
    });

    it('com outros membros na família: soft-delete só do user', async () => {
      const user = buildUser();
      txUserRepo.findOne.mockResolvedValue(user);
      txUserRepo.count.mockResolvedValue(1); // sobrou 1 membro ativo

      await service.deleteAccount('user-1');

      expect(txUserRepo.softRemove).toHaveBeenCalledWith(user);
      // Família e bebês continuam com quem ficou.
      expect(txFamilyRepo.softRemove).not.toHaveBeenCalled();
      expect(txBabyRepo.softRemove).not.toHaveBeenCalled();
    });

    it('último membro: soft-delete do user + bebês + família', async () => {
      const user = buildUser();
      const family = { id: 'family-1', name: null } as Family;
      const babies = [{ id: 'baby-1' } as Baby, { id: 'baby-2' } as Baby];
      txUserRepo.findOne.mockResolvedValue(user);
      txUserRepo.count.mockResolvedValue(0); // família ficou vazia
      txBabyRepo.find.mockResolvedValue(babies);
      txFamilyRepo.findOne.mockResolvedValue(family);

      await service.deleteAccount('user-1');

      expect(txUserRepo.softRemove).toHaveBeenCalledWith(user);
      expect(txBabyRepo.softRemove).toHaveBeenCalledWith(babies);
      expect(txFamilyRepo.softRemove).toHaveBeenCalledWith(family);
    });

    it('último membro sem bebês: não chama softRemove de bebês', async () => {
      txUserRepo.findOne.mockResolvedValue(buildUser());
      txUserRepo.count.mockResolvedValue(0);
      txBabyRepo.find.mockResolvedValue([]);
      txFamilyRepo.findOne.mockResolvedValue({ id: 'family-1' });

      await service.deleteAccount('user-1');

      expect(txBabyRepo.softRemove).not.toHaveBeenCalled();
      expect(txFamilyRepo.softRemove).toHaveBeenCalled();
    });
  });
});
