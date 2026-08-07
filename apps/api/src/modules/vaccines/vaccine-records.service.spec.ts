import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Baby } from '../babies/entities/baby.entity';
import { VaccineRecord } from './entities/vaccine-record.entity';
import { Vaccine } from './entities/vaccine.entity';
import { VaccineRecordsService } from './vaccine-records.service';

function buildBaby(overrides: Partial<Baby> = {}): Baby {
  return { id: 'baby-1', familyId: 'family-1', name: 'Theo', ...overrides } as Baby;
}

function buildVaccine(overrides: Partial<Vaccine> = {}): Vaccine {
  return { id: 'vac-1', code: 'PENTA_1', name: 'Pentavalente', ...overrides } as Vaccine;
}

function buildRecord(overrides: Partial<VaccineRecord> = {}): VaccineRecord {
  return {
    id: 'rec-1',
    babyId: 'baby-1',
    vaccineId: 'vac-1',
    familyId: 'family-1',
    appliedAt: '2026-01-05',
    lotNumber: null,
    location: null,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as VaccineRecord;
}

describe('VaccineRecordsService', () => {
  let service: VaccineRecordsService;
  let recordsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let vaccinesRepo: { findOne: jest.Mock };
  let babiesRepo: { findOne: jest.Mock };

  const createDto = {
    vaccineId: 'vac-1',
    appliedAt: '2026-01-05',
  };

  beforeEach(async () => {
    recordsRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      find: jest.fn(async () => []),
      findOne: jest.fn(),
      remove: jest.fn(async () => undefined),
    };
    vaccinesRepo = { findOne: jest.fn() };
    babiesRepo = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        VaccineRecordsService,
        { provide: getRepositoryToken(VaccineRecord), useValue: recordsRepo },
        { provide: getRepositoryToken(Vaccine), useValue: vaccinesRepo },
        { provide: getRepositoryToken(Baby), useValue: babiesRepo },
      ],
    }).compile();

    service = module.get(VaccineRecordsService);
  });

  describe('create', () => {
    it('lança NotFound quando o bebê não existe', async () => {
      babiesRepo.findOne.mockResolvedValue(null);

      await expect(service.create('baby-x', 'family-1', createDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lança Forbidden quando o bebê é de outra família', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby({ familyId: 'outra-familia' }));

      await expect(service.create('baby-1', 'family-1', createDto)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('lança NotFound quando a vacina não está no catálogo', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());
      vaccinesRepo.findOne.mockResolvedValue(null);

      await expect(service.create('baby-1', 'family-1', createDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lança Conflict quando a dose já foi registrada pro bebê (1 record por vacina)', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());
      vaccinesRepo.findOne.mockResolvedValue(buildVaccine());
      recordsRepo.findOne.mockResolvedValue(buildRecord()); // duplicata

      await expect(service.create('baby-1', 'family-1', createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(recordsRepo.save).not.toHaveBeenCalled();
    });

    it('registra dose com lote/local trimados e desnormaliza familyId', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());
      vaccinesRepo.findOne.mockResolvedValue(buildVaccine());
      recordsRepo.findOne.mockResolvedValue(null);

      await service.create('baby-1', 'family-1', {
        ...createDto,
        lotNumber: '  LOTE-2026A  ',
        location: ' UBS Compensa ',
        notes: '   ', // só espaços → null
      });

      expect(recordsRepo.create).toHaveBeenCalledWith({
        babyId: 'baby-1',
        vaccineId: 'vac-1',
        familyId: 'family-1',
        appliedAt: '2026-01-05',
        lotNumber: 'LOTE-2026A',
        location: 'UBS Compensa',
        notes: null,
      });
      expect(recordsRepo.save).toHaveBeenCalled();
    });
  });

  describe('findAllByBaby', () => {
    it('valida o escopo do bebê antes de listar', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby({ familyId: 'outra-familia' }));

      await expect(service.findAllByBaby('baby-1', 'family-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(recordsRepo.find).not.toHaveBeenCalled();
    });

    it('lista com a vacina populada, aplicações mais recentes primeiro', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());

      await service.findAllByBaby('baby-1', 'family-1');

      expect(recordsRepo.find).toHaveBeenCalledWith({
        where: { babyId: 'baby-1' },
        relations: { vaccine: true },
        order: { appliedAt: 'DESC' },
      });
    });
  });

  describe('update', () => {
    it('lança NotFound quando o registro não existe', async () => {
      recordsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('rec-x', 'baby-1', 'family-1', { appliedAt: '2026-02-01' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lança Forbidden quando o registro é de outro bebê/família', async () => {
      recordsRepo.findOne.mockResolvedValue(buildRecord({ familyId: 'outra-familia' }));

      await expect(
        service.update('rec-1', 'baby-1', 'family-1', { appliedAt: '2026-02-01' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('aplica só os campos enviados; string vazia limpa o campo', async () => {
      recordsRepo.findOne.mockResolvedValue(
        buildRecord({ lotNumber: 'LOTE-OLD', location: 'UBS Centro' }),
      );

      const updated = await service.update('rec-1', 'baby-1', 'family-1', {
        appliedAt: '2026-02-01',
        lotNumber: '',
      });

      expect(updated.appliedAt).toBe('2026-02-01');
      expect(updated.lotNumber).toBeNull(); // limpo
      expect(updated.location).toBe('UBS Centro'); // inalterado
    });
  });

  describe('remove', () => {
    it('lança Forbidden quando o registro pertence a outro bebê', async () => {
      recordsRepo.findOne.mockResolvedValue(buildRecord({ babyId: 'outro-baby' }));

      await expect(service.remove('rec-1', 'baby-1', 'family-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(recordsRepo.remove).not.toHaveBeenCalled();
    });

    it('faz hard delete do registro do próprio escopo (registro errado pode sumir)', async () => {
      const record = buildRecord();
      recordsRepo.findOne.mockResolvedValue(record);

      await service.remove('rec-1', 'baby-1', 'family-1');

      expect(recordsRepo.remove).toHaveBeenCalledWith(record);
    });
  });
});
