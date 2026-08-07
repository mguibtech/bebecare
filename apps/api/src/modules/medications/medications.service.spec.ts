import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DoseUnit } from '../../common/enums/dose-unit.enum';
import { Baby } from '../babies/entities/baby.entity';
import { Medication } from './entities/medication.entity';
import { MedicationsService } from './medications.service';

function buildBaby(overrides: Partial<Baby> = {}): Baby {
  return {
    id: 'baby-1',
    familyId: 'family-1',
    name: 'Theo',
    ...overrides,
  } as Baby;
}

function buildMedication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'med-1',
    babyId: 'baby-1',
    familyId: 'family-1',
    name: 'Paracetamol',
    dose: '2.500',
    doseUnit: DoseUnit.ML,
    instructions: null,
    startDate: '2026-08-01',
    endDate: null,
    isActive: true,
    schedules: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as Medication;
}

describe('MedicationsService', () => {
  let service: MedicationsService;
  let medicationsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    softRemove: jest.Mock;
  };
  let babiesRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    medicationsRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      find: jest.fn(async () => []),
      findOne: jest.fn(),
      softRemove: jest.fn(async () => undefined),
    };
    babiesRepo = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        MedicationsService,
        { provide: getRepositoryToken(Medication), useValue: medicationsRepo },
        { provide: getRepositoryToken(Baby), useValue: babiesRepo },
      ],
    }).compile();

    service = module.get(MedicationsService);
  });

  describe('create', () => {
    it('lança NotFound quando o bebê não existe', async () => {
      babiesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('baby-x', 'family-1', {
          name: 'Paracetamol',
          dose: 2.5,
          doseUnit: DoseUnit.ML,
          startDate: '2026-08-01',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lança Forbidden quando o bebê pertence a outra família', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby({ familyId: 'outra-familia' }));

      await expect(
        service.create('baby-1', 'family-1', {
          name: 'Paracetamol',
          dose: 2.5,
          doseUnit: DoseUnit.ML,
          startDate: '2026-08-01',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('normaliza a dose numérica pra string com 3 casas (coluna numeric)', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());

      await service.create('baby-1', 'family-1', {
        name: 'Vitamina D',
        dose: 1,
        doseUnit: DoseUnit.DROP,
        startDate: '2026-08-01',
      });

      expect(medicationsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ dose: '1.000' }),
      );
    });

    it('aplica defaults: isActive=true, endDate=null (uso contínuo), instructions trim → null', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());

      await service.create('baby-1', 'family-1', {
        name: '  Amoxicilina  ',
        dose: 5,
        doseUnit: DoseUnit.ML,
        startDate: '2026-08-01',
        instructions: '   ',
      });

      expect(medicationsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Amoxicilina',
          isActive: true,
          endDate: null,
          instructions: null,
        }),
      );
    });
  });

  describe('findOne', () => {
    it('lança NotFound quando o remédio não existe', async () => {
      medicationsRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('med-x', 'baby-1', 'family-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lança Forbidden quando o remédio é de outro bebê', async () => {
      medicationsRepo.findOne.mockResolvedValue(buildMedication({ babyId: 'outro-baby' }));

      await expect(service.findOne('med-1', 'baby-1', 'family-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('lança Forbidden quando o remédio é de outra família', async () => {
      medicationsRepo.findOne.mockResolvedValue(buildMedication({ familyId: 'outra-familia' }));

      await expect(service.findOne('med-1', 'baby-1', 'family-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('findAllByBaby', () => {
    it('valida o escopo do bebê antes de listar', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby({ familyId: 'outra-familia' }));

      await expect(service.findAllByBaby('baby-1', 'family-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(medicationsRepo.find).not.toHaveBeenCalled();
    });

    it('lista com schedules populados, mais recentes primeiro', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());

      await service.findAllByBaby('baby-1', 'family-1');

      expect(medicationsRepo.find).toHaveBeenCalledWith({
        where: { babyId: 'baby-1' },
        relations: { schedules: true },
        order: { startDate: 'DESC' },
      });
    });
  });

  describe('update', () => {
    it('aplica só campos enviados; dose renormalizada com 3 casas', async () => {
      medicationsRepo.findOne.mockResolvedValue(buildMedication());

      const updated = await service.update('med-1', 'baby-1', 'family-1', { dose: 7.5 });

      expect(updated.dose).toBe('7.500');
      expect(updated.name).toBe('Paracetamol'); // inalterado
      expect(updated.startDate).toBe('2026-08-01'); // inalterado
    });

    it('permite encerrar tratamento setando endDate e desativar com isActive=false', async () => {
      medicationsRepo.findOne.mockResolvedValue(buildMedication());

      const updated = await service.update('med-1', 'baby-1', 'family-1', {
        endDate: '2026-08-15',
        isActive: false,
      });

      expect(updated.endDate).toBe('2026-08-15');
      expect(updated.isActive).toBe(false);
    });

    it('instructions vazia após trim limpa o campo (null)', async () => {
      medicationsRepo.findOne.mockResolvedValue(buildMedication({ instructions: 'Após o banho' }));

      const updated = await service.update('med-1', 'baby-1', 'family-1', {
        instructions: '  ',
      });

      expect(updated.instructions).toBeNull();
    });
  });

  describe('remove', () => {
    it('faz soft-remove (histórico de doses continua acessível)', async () => {
      const med = buildMedication();
      medicationsRepo.findOne.mockResolvedValue(med);

      await service.remove('med-1', 'baby-1', 'family-1');

      expect(medicationsRepo.softRemove).toHaveBeenCalledWith(med);
    });
  });
});
