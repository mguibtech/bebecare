import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AvatarStyle } from '../../common/enums/avatar-style.enum';
import { BloodType } from '../../common/enums/blood-type.enum';
import { Sex } from '../../common/enums/sex.enum';
import { BabiesService } from './babies.service';
import { Baby } from './entities/baby.entity';

function buildBaby(overrides: Partial<Baby> = {}): Baby {
  return {
    id: 'baby-1',
    familyId: 'family-1',
    family: undefined as any,
    name: 'Theo',
    sex: Sex.MALE,
    birthDate: '2025-08-15',
    birthWeightGrams: 3450,
    birthHeightCm: '49.50',
    bloodType: null,
    allergies: null,
    eyeColor: null,
    notes: null,
    avatarStyle: AvatarStyle.LORELEI,
    avatarSeed: 'theo',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as Baby;
}

describe('BabiesService', () => {
  let service: BabiesService;
  let repo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    softRemove: jest.Mock;
  };

  beforeEach(async () => {
    repo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      find: jest.fn(),
      findOne: jest.fn(),
      softRemove: jest.fn(async () => undefined),
    };

    const module = await Test.createTestingModule({
      providers: [BabiesService, { provide: getRepositoryToken(Baby), useValue: repo }],
    }).compile();

    service = module.get(BabiesService);
  });

  describe('create', () => {
    it('associa à família do user e aplica defaults (avatar lorelei + seed do nome)', async () => {
      await service.create('family-1', {
        name: '  Theo Silva ',
        sex: Sex.MALE,
        birthDate: '2025-08-15',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          familyId: 'family-1',
          name: 'Theo Silva',
          avatarStyle: AvatarStyle.LORELEI,
          avatarSeed: 'theo-silva', // nome em lowercase com hífens
          birthWeightGrams: null,
          birthHeightCm: null,
          bloodType: null,
          allergies: null,
        }),
      );
      expect(repo.save).toHaveBeenCalled();
    });

    it('converte birthHeightCm pra string com 2 casas e respeita avatar informado', async () => {
      await service.create('family-1', {
        name: 'Alice',
        sex: Sex.FEMALE,
        birthDate: '2025-03-01',
        birthWeightGrams: 3100,
        birthHeightCm: 49.5,
        bloodType: BloodType.O_POSITIVE,
        allergies: '  Leite de vaca ',
        avatarStyle: AvatarStyle.MICAH,
        avatarSeed: '  alice-avatar  ',
      });

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          birthWeightGrams: 3100,
          birthHeightCm: '49.50', // numeric do pg trafega como string
          bloodType: BloodType.O_POSITIVE,
          allergies: 'Leite de vaca',
          avatarStyle: AvatarStyle.MICAH,
          avatarSeed: 'alice-avatar',
        }),
      );
    });
  });

  describe('findOneByFamily (escopo por família)', () => {
    it('retorna o bebê quando pertence à família do user', async () => {
      const baby = buildBaby();
      repo.findOne.mockResolvedValue(baby);

      await expect(service.findOneByFamily('baby-1', 'family-1')).resolves.toBe(baby);
    });

    it('lança NotFound quando o bebê não existe', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(service.findOneByFamily('ghost', 'family-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lança Forbidden quando o bebê é de outra família', async () => {
      repo.findOne.mockResolvedValue(buildBaby({ familyId: 'family-2' }));

      await expect(service.findOneByFamily('baby-1', 'family-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('aplica só os campos enviados e mantém o resto', async () => {
      repo.findOne.mockResolvedValue(buildBaby());

      const updated = await service.update('baby-1', 'family-1', { name: '  Theo Miguel  ' });

      expect(updated.name).toBe('Theo Miguel');
      expect(updated.birthDate).toBe('2025-08-15'); // inalterado
      expect(updated.birthWeightGrams).toBe(3450); // inalterado
      expect(repo.save).toHaveBeenCalled();
    });

    it('string vazia limpa campos texto opcionais (viram null)', async () => {
      repo.findOne.mockResolvedValue(buildBaby({ allergies: 'Ovo', notes: 'obs' }));

      const updated = await service.update('baby-1', 'family-1', { allergies: '', notes: '  ' });

      expect(updated.allergies).toBeNull();
      expect(updated.notes).toBeNull();
    });

    it('converte birthHeightCm numérico pra string e ignora avatarSeed vazia', async () => {
      repo.findOne.mockResolvedValue(buildBaby({ avatarSeed: 'seed-atual' }));

      const updated = await service.update('baby-1', 'family-1', {
        birthHeightCm: 52.1,
        avatarSeed: '   ',
      });

      expect(updated.birthHeightCm).toBe('52.10');
      expect(updated.avatarSeed).toBe('seed-atual'); // seed vazia não sobrescreve
    });

    it('lança Forbidden ao tentar atualizar bebê de outra família', async () => {
      repo.findOne.mockResolvedValue(buildBaby({ familyId: 'family-2' }));

      await expect(service.update('baby-1', 'family-1', { name: 'Hacker' })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('soft-remove do bebê da própria família', async () => {
      const baby = buildBaby();
      repo.findOne.mockResolvedValue(baby);

      await service.remove('baby-1', 'family-1');

      expect(repo.softRemove).toHaveBeenCalledWith(baby);
    });

    it('lança Forbidden ao tentar remover bebê de outra família', async () => {
      repo.findOne.mockResolvedValue(buildBaby({ familyId: 'family-2' }));

      await expect(service.remove('baby-1', 'family-1')).rejects.toBeInstanceOf(ForbiddenException);
      expect(repo.softRemove).not.toHaveBeenCalled();
    });
  });
});
