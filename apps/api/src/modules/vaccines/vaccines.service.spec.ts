import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VaccineStatus } from '../../common/enums/vaccine-status.enum';
import { Baby } from '../babies/entities/baby.entity';
import { VaccineRecord } from './entities/vaccine-record.entity';
import { Vaccine } from './entities/vaccine.entity';
import { VaccinesService } from './vaccines.service';

// "Hoje" fixo. Bebê nascido em 01/11/2025 → exatos 9 meses completos.
const NOW = new Date('2026-08-07T12:00:00.000Z');

function buildBaby(overrides: Partial<Baby> = {}): Baby {
  return {
    id: 'baby-1',
    familyId: 'family-1',
    name: 'Theo',
    birthDate: '2025-11-01',
    ...overrides,
  } as Baby;
}

function buildVaccine(overrides: Partial<Vaccine> = {}): Vaccine {
  return {
    id: 'vac-1',
    code: 'BCG',
    name: 'BCG',
    description: 'Previne formas graves de tuberculose.',
    doseLabel: 'Dose única',
    doseNumber: 1,
    isBooster: false,
    recommendedAgeMonths: 0,
    minAgeMonths: 0,
    maxAgeMonths: null,
    displayOrder: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as Vaccine;
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
    ...overrides,
  } as VaccineRecord;
}

describe('VaccinesService', () => {
  let service: VaccinesService;
  let vaccinesRepo: { find: jest.Mock };
  let recordsRepo: { find: jest.Mock };
  let babiesRepo: { findOne: jest.Mock };

  beforeAll(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    vaccinesRepo = { find: jest.fn(async () => []) };
    recordsRepo = { find: jest.fn(async () => []) };
    babiesRepo = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        VaccinesService,
        { provide: getRepositoryToken(Vaccine), useValue: vaccinesRepo },
        { provide: getRepositoryToken(VaccineRecord), useValue: recordsRepo },
        { provide: getRepositoryToken(Baby), useValue: babiesRepo },
      ],
    }).compile();

    service = module.get(VaccinesService);
  });

  describe('getCatalog', () => {
    it('lista só vacinas ativas, na ordem de exibição do PNI', async () => {
      await service.getCatalog();

      expect(vaccinesRepo.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { displayOrder: 'ASC' },
      });
    });

    it('lang=en troca nome/descrição/doseLabel pelas traduções do code', async () => {
      vaccinesRepo.find.mockResolvedValue([buildVaccine()]); // code BCG tem tradução

      const [item] = await service.getCatalog('en');

      expect(item.doseLabel).toBe('Single dose');
      expect(item.description).toContain('tuberculosis');
    });

    it('code sem tradução cai no fallback pt do banco (não quebra o catálogo)', async () => {
      vaccinesRepo.find.mockResolvedValue([
        buildVaccine({ code: 'CODIGO_SEM_TRADUCAO', doseLabel: '1ª dose' }),
      ]);

      const [item] = await service.getCatalog('en');

      expect(item.doseLabel).toBe('1ª dose');
      expect(item.description).toBe('Previne formas graves de tuberculose.');
    });
  });

  describe('buildScheduleForBaby', () => {
    it('lança NotFound quando o bebê não existe', async () => {
      babiesRepo.findOne.mockResolvedValue(null);

      await expect(service.buildScheduleForBaby('baby-x', 'family-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('bebê de outra família também vira NotFound (não vaza a existência)', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby({ familyId: 'outra-familia' }));

      await expect(service.buildScheduleForBaby('baby-1', 'family-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('calcula status por idade (9 meses), ordena overdue→due→upcoming→applied e soma o resumo', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());
      // Catálogo cobre todos os ramos da regra de status:
      const applied = buildVaccine({ id: 'vac-aplicada', code: 'BCG', displayOrder: 1 });
      const overdueByTolerance = buildVaccine({
        id: 'vac-atrasada',
        code: 'PENTA_1',
        recommendedAgeMonths: 2,
        minAgeMonths: 2,
        displayOrder: 2,
      }); // 9 > 2+6 → OVERDUE
      const overdueByMaxAge = buildVaccine({
        id: 'vac-janela-fechada',
        code: 'ROTA_1',
        recommendedAgeMonths: 6,
        minAgeMonths: 6,
        maxAgeMonths: 7,
        displayOrder: 3,
      }); // 9 > max 7 → OVERDUE
      const due = buildVaccine({
        id: 'vac-em-dia',
        code: 'MENC_REF',
        recommendedAgeMonths: 9,
        minAgeMonths: 9,
        displayOrder: 4,
      }); // idade == mínima → DUE (não UPCOMING)
      const upcoming = buildVaccine({
        id: 'vac-futura',
        code: 'TRIPLICE_1',
        recommendedAgeMonths: 12,
        minAgeMonths: 12,
        displayOrder: 5,
      }); // ainda não atingiu a idade mínima
      vaccinesRepo.find.mockResolvedValue([
        applied,
        overdueByTolerance,
        overdueByMaxAge,
        due,
        upcoming,
      ]);
      recordsRepo.find.mockResolvedValue([
        buildRecord({ id: 'rec-1', vaccineId: 'vac-aplicada', appliedAt: '2025-11-02' }),
      ]);

      const schedule = await service.buildScheduleForBaby('baby-1', 'family-1');

      expect(schedule.babyAgeMonths).toBe(9);
      expect(schedule.entries.map((e) => [e.vaccine.id, e.status])).toEqual([
        ['vac-atrasada', VaccineStatus.OVERDUE],
        ['vac-janela-fechada', VaccineStatus.OVERDUE],
        ['vac-em-dia', VaccineStatus.DUE],
        ['vac-futura', VaccineStatus.UPCOMING],
        ['vac-aplicada', VaccineStatus.APPLIED],
      ]);
      expect(schedule.summary).toEqual({
        [VaccineStatus.OVERDUE]: 2,
        [VaccineStatus.DUE]: 1,
        [VaccineStatus.UPCOMING]: 1,
        [VaccineStatus.APPLIED]: 1,
      });

      // Entrada aplicada carrega o vínculo com o record (pro front editar/excluir)
      const appliedEntry = schedule.entries.find((e) => e.status === VaccineStatus.APPLIED)!;
      expect(appliedEntry.recordId).toBe('rec-1');
      expect(appliedEntry.appliedAt).toBe('2025-11-02');

      // Não aplicada: expectedAt = birthDate + recommendedAgeMonths
      const dueEntry = schedule.entries.find((e) => e.status === VaccineStatus.DUE)!;
      expect(dueEntry.expectedAt).toBe('2026-08-01'); // 2025-11-01 + 9 meses
      expect(dueEntry.recordId).toBeNull();
    });

    it('no limite exato da tolerância (recomendada + 6 meses) ainda é DUE, não OVERDUE', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby()); // 9 meses
      vaccinesRepo.find.mockResolvedValue([
        buildVaccine({ recommendedAgeMonths: 3, minAgeMonths: 3 }), // 3+6 = 9 == idade
      ]);

      const schedule = await service.buildScheduleForBaby('baby-1', 'family-1');

      expect(schedule.entries[0].status).toBe(VaccineStatus.DUE);
    });

    it('na idade máxima exata a dose ainda é DUE (janela fecha depois do mês)', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby()); // 9 meses
      vaccinesRepo.find.mockResolvedValue([
        buildVaccine({ recommendedAgeMonths: 6, minAgeMonths: 6, maxAgeMonths: 9 }),
      ]);

      const schedule = await service.buildScheduleForBaby('baby-1', 'family-1');

      expect(schedule.entries[0].status).toBe(VaccineStatus.DUE);
    });

    it('desempate dentro do mesmo status segue o displayOrder do catálogo', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());
      vaccinesRepo.find.mockResolvedValue([
        buildVaccine({
          id: 'vac-b',
          code: 'B',
          recommendedAgeMonths: 9,
          minAgeMonths: 9,
          displayOrder: 10,
        }),
        buildVaccine({
          id: 'vac-a',
          code: 'A',
          recommendedAgeMonths: 9,
          minAgeMonths: 9,
          displayOrder: 2,
        }),
      ]);

      const schedule = await service.buildScheduleForBaby('baby-1', 'family-1');

      expect(schedule.entries.map((e) => e.vaccine.id)).toEqual(['vac-a', 'vac-b']);
    });
  });
});
