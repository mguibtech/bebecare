import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { FamilyInvite } from '../families/entities/family-invite.entity';
import { FamiliesService } from '../families/families.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RefreshTokenService } from './refresh-token.service';
import { AvatarStyle } from '../../common/enums/avatar-style.enum';

// Mock factories — mantidas locais ao arquivo pra facilitar a leitura.
function buildUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-id-1',
    email: 'mguib@example.com',
    name: 'Mguib',
    passwordHash: '',
    fcmToken: null,
    avatarStyle: AvatarStyle.ADVENTURER,
    avatarSeed: 'mguib',
    familyId: 'family-id-1',
    family: undefined as any,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    assignUuid: () => undefined,
    ...overrides,
  } as User;
}

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let familiesService: jest.Mocked<FamiliesService>;
  let refreshTokens: jest.Mocked<RefreshTokenService>;

  // A transação do AuthService usa dataSource.transaction(callback).
  // Vamos simular a "manager" como um objeto vazio que os mocks dos services aceitam.
  const fakeDataSource = {
    transaction: jest.fn((cb: (manager: any) => Promise<unknown>) =>
      cb({ save: jest.fn(), findOne: jest.fn() }),
    ),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getDataSourceToken(), useValue: fakeDataSource },
        {
          provide: getRepositoryToken(FamilyInvite),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: FamiliesService,
          useValue: {
            create: jest.fn(),
            findByIdWithMembers: jest.fn(),
          },
        },
        {
          provide: RefreshTokenService,
          useValue: {
            issue: jest.fn(),
            rotate: jest.fn(),
            validate: jest.fn(),
            revoke: jest.fn(),
            revokeAllForUser: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn().mockResolvedValue('signed.jwt.token') },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, def?: string) => {
              if (key === 'JWT_ACCESS_EXPIRES_IN') return '15m';
              return def;
            }),
          },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    familiesService = module.get(FamiliesService);
    refreshTokens = module.get(RefreshTokenService);
  });

  describe('register', () => {
    it('cria família solo + user e devolve tokens quando não há convite', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      const family = { id: 'family-new', name: null } as any;
      familiesService.create.mockResolvedValue(family);
      const created = buildUser({ id: 'user-new', familyId: 'family-new' });
      usersService.create.mockResolvedValue(created);
      refreshTokens.issue.mockResolvedValue({
        plainToken: 'refresh-plain',
        record: {} as any,
      });

      const result = await service.register({
        email: 'novo@example.com',
        name: 'Novo',
        password: 'senha12345',
      });

      expect(familiesService.create).toHaveBeenCalled();
      expect(usersService.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toBe('refresh-plain');
      expect(result.expiresIn).toBe(900);
      expect(result.user.id).toBe('user-new');
      expect(result.user.familyId).toBe('family-new');
    });

    it('lança ConflictException se email já está em uso', async () => {
      usersService.findByEmail.mockResolvedValue(buildUser());

      await expect(
        service.register({
          email: 'mguib@example.com',
          name: 'X',
          password: 'senha12345',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('retorna tokens quando credenciais batem', async () => {
      const hash = await bcrypt.hash('senha12345', 4);
      usersService.findByEmail.mockResolvedValue(buildUser({ passwordHash: hash }));
      refreshTokens.issue.mockResolvedValue({
        plainToken: 'refresh-plain',
        record: {} as any,
      });

      const result = await service.login({
        email: 'mguib@example.com',
        password: 'senha12345',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.refreshToken).toBe('refresh-plain');
    });

    it('lança UnauthorizedException se a senha não bate', async () => {
      const hash = await bcrypt.hash('outraSenha', 4);
      usersService.findByEmail.mockResolvedValue(buildUser({ passwordHash: hash }));

      await expect(
        service.login({ email: 'mguib@example.com', password: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lança UnauthorizedException se o email não existe (sem vazar essa info)', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nope@example.com', password: 'qualquer' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rotaciona o refresh e devolve novo par de tokens', async () => {
      refreshTokens.validate.mockResolvedValue({
        id: 'rt-1',
        userId: 'user-id-1',
      } as any);
      usersService.findById.mockResolvedValue(buildUser());
      refreshTokens.rotate.mockResolvedValue({
        plainToken: 'refresh-novo',
        record: {} as any,
      });

      const result = await service.refresh('refresh-velho');

      expect(refreshTokens.validate).toHaveBeenCalledWith('refresh-velho');
      expect(refreshTokens.rotate).toHaveBeenCalled();
      expect(result.refreshToken).toBe('refresh-novo');
    });
  });

  describe('buildMeResponse', () => {
    it('retorna user + família com lista de outros membros (vazia quando solo)', async () => {
      const user = buildUser({ familyId: 'fam-1' });
      familiesService.findByIdWithMembers.mockResolvedValue({
        id: 'fam-1',
        name: null,
        members: [user],
      } as any);

      const result = await service.buildMeResponse(user);

      expect(result.family.id).toBe('fam-1');
      expect(result.family.members).toEqual([]);
    });

    it('retorna outros membros quando família tem mais de um user', async () => {
      const me = buildUser({ id: 'me', familyId: 'fam-1' });
      const partner = buildUser({ id: 'partner', name: 'Partner', familyId: 'fam-1' });
      familiesService.findByIdWithMembers.mockResolvedValue({
        id: 'fam-1',
        name: 'Família Silva',
        members: [me, partner],
      } as any);

      const result = await service.buildMeResponse(me);

      expect(result.family.name).toBe('Família Silva');
      expect(result.family.members).toHaveLength(1);
      expect(result.family.members[0].id).toBe('partner');
    });
  });
});
