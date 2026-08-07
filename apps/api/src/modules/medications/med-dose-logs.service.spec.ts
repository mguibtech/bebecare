import { BadRequestException, ForbiddenException, Logger, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between } from 'typeorm';
import { DoseStatus } from '../../common/enums/dose-status.enum';
import { DoseUnit } from '../../common/enums/dose-unit.enum';
import { Baby } from '../babies/entities/baby.entity';
import { MedDoseLog } from './entities/med-dose-log.entity';
import { MedSchedule } from './entities/med-schedule.entity';
import { Medication } from './entities/medication.entity';
import { MedDoseLogsService } from './med-dose-logs.service';

// 07/08/2026 é uma SEXTA-FEIRA (getUTCDay()=5 → bit 32 no daysOfWeekMask).
const NOW = new Date('2026-08-07T15:00:00.000Z');

function buildBaby(overrides: Partial<Baby> = {}): Baby {
  return { id: 'baby-1', familyId: 'family-1', name: 'Theo', ...overrides } as Baby;
}

function buildMedication(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'med-1',
    babyId: 'baby-1',
    familyId: 'family-1',
    name: 'Paracetamol',
    dose: '2.500',
    doseUnit: DoseUnit.ML,
    isActive: true,
    ...overrides,
  } as Medication;
}

function buildSchedule(overrides: Partial<MedSchedule> = {}): MedSchedule {
  return {
    id: 'sched-1',
    medicationId: 'med-1',
    medication: buildMedication(),
    time: '08:30',
    daysOfWeekMask: 127,
    useAlarm: true,
    isActive: true,
    ...overrides,
  } as MedSchedule;
}

function buildLog(overrides: Partial<MedDoseLog> = {}): MedDoseLog {
  return {
    id: 'log-1',
    medicationId: 'med-1',
    scheduleId: 'sched-1',
    babyId: 'baby-1',
    familyId: 'family-1',
    scheduledFor: new Date('2026-08-07T08:30:00.000Z'),
    status: DoseStatus.PENDING,
    takenAt: null,
    skipReason: null,
    loggedByUserId: null,
    loggedByUser: null,
    notifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as MedDoseLog;
}

describe('MedDoseLogsService', () => {
  let service: MedDoseLogsService;
  let doseLogsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
  };
  let schedulesRepo: { createQueryBuilder: jest.Mock };
  let babiesRepo: { findOne: jest.Mock };

  beforeAll(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    doseLogsRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      find: jest.fn(async () => []),
      findOne: jest.fn(),
    };
    schedulesRepo = { createQueryBuilder: jest.fn() };
    babiesRepo = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        MedDoseLogsService,
        { provide: getRepositoryToken(MedDoseLog), useValue: doseLogsRepo },
        { provide: getRepositoryToken(Medication), useValue: { findOne: jest.fn() } },
        { provide: getRepositoryToken(MedSchedule), useValue: schedulesRepo },
        { provide: getRepositoryToken(Baby), useValue: babiesRepo },
      ],
    }).compile();

    service = module.get(MedDoseLogsService);
  });

  describe('take', () => {
    it('lança NotFound quando a dose não existe', async () => {
      doseLogsRepo.findOne.mockResolvedValue(null);

      await expect(service.take('log-x', 'baby-1', 'family-1', 'user-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lança Forbidden quando a dose é de outra família', async () => {
      doseLogsRepo.findOne.mockResolvedValue(buildLog({ familyId: 'outra-familia' }));

      await expect(service.take('log-1', 'baby-1', 'family-1', 'user-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('marca PENDING como TAKEN com takenAt=agora e registra quem marcou', async () => {
      const log = buildLog({ skipReason: 'motivo antigo' });
      doseLogsRepo.findOne.mockResolvedValue(log);

      await service.take('log-1', 'baby-1', 'family-1', 'user-1');

      expect(log.status).toBe(DoseStatus.TAKEN);
      expect(log.takenAt).toEqual(NOW);
      expect(log.skipReason).toBeNull(); // limpa resto de skip anterior
      expect(log.loggedByUserId).toBe('user-1');
      expect(doseLogsRepo.save).toHaveBeenCalledWith(log);
      // Recarrega depois do save pra devolver relations atualizadas
      expect(doseLogsRepo.findOne).toHaveBeenCalledTimes(2);
    });

    it('é idempotente: dose já TAKEN retorna sem salvar de novo', async () => {
      doseLogsRepo.findOne.mockResolvedValue(
        buildLog({ status: DoseStatus.TAKEN, takenAt: new Date('2026-08-07T08:35:00.000Z') }),
      );

      const result = await service.take('log-1', 'baby-1', 'family-1', 'user-2');

      expect(result.status).toBe(DoseStatus.TAKEN);
      expect(doseLogsRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('skip', () => {
    it('lança BadRequest ao pular dose já TAKEN', async () => {
      doseLogsRepo.findOne.mockResolvedValue(buildLog({ status: DoseStatus.TAKEN }));

      await expect(
        service.skip('log-1', 'baby-1', 'family-1', 'user-1', { reason: 'vomitou' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(doseLogsRepo.save).not.toHaveBeenCalled();
    });

    it('marca como SKIPPED com motivo trimado e zera takenAt', async () => {
      const log = buildLog({ takenAt: new Date() });
      doseLogsRepo.findOne.mockResolvedValue(log);

      await service.skip('log-1', 'baby-1', 'family-1', 'user-1', {
        reason: '  Bebê dormindo  ',
      });

      expect(log.status).toBe(DoseStatus.SKIPPED);
      expect(log.skipReason).toBe('Bebê dormindo');
      expect(log.takenAt).toBeNull();
      expect(log.loggedByUserId).toBe('user-1');
    });

    it('motivo ausente vira null (skip sem justificativa é permitido)', async () => {
      const log = buildLog();
      doseLogsRepo.findOne.mockResolvedValue(log);

      await service.skip('log-1', 'baby-1', 'family-1', 'user-1', {});

      expect(log.status).toBe(DoseStatus.SKIPPED);
      expect(log.skipReason).toBeNull();
    });
  });

  describe('resetToPending', () => {
    it('reverte SKIPPED pra PENDING limpando takenAt/skipReason', async () => {
      const log = buildLog({
        status: DoseStatus.SKIPPED,
        skipReason: 'engano',
        loggedByUserId: 'user-1',
      });
      doseLogsRepo.findOne.mockResolvedValue(log);

      await service.resetToPending('log-1', 'baby-1', 'family-1', 'user-2');

      expect(log.status).toBe(DoseStatus.PENDING);
      expect(log.takenAt).toBeNull();
      expect(log.skipReason).toBeNull();
      expect(log.loggedByUserId).toBe('user-2'); // quem desfez fica registrado
      expect(doseLogsRepo.save).toHaveBeenCalledWith(log);
    });
  });

  describe('findToday', () => {
    it('filtra pela janela do dia UTC atual [00:00, 00:00 do dia seguinte)', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());

      await service.findToday('baby-1', 'family-1');

      expect(doseLogsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            babyId: 'baby-1',
            scheduledFor: Between(
              new Date('2026-08-07T00:00:00.000Z'),
              new Date('2026-08-08T00:00:00.000Z'),
            ),
          },
          order: { scheduledFor: 'ASC' },
        }),
      );
    });

    it('valida o escopo do bebê antes de listar', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby({ familyId: 'outra-familia' }));

      await expect(service.findToday('baby-1', 'family-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('findHistory', () => {
    it('aplica filtros de status e range, com limite de 200 registros', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());

      await service.findHistory('baby-1', 'family-1', {
        status: DoseStatus.SKIPPED,
        from: '2026-08-01T00:00:00.000Z',
        to: '2026-08-07T00:00:00.000Z',
      });

      expect(doseLogsRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            babyId: 'baby-1',
            status: DoseStatus.SKIPPED,
            scheduledFor: Between(
              new Date('2026-08-01T00:00:00.000Z'),
              new Date('2026-08-07T00:00:00.000Z'),
            ),
          },
          take: 200,
        }),
      );
    });
  });

  describe('createTodayLogs (cron helper — recorrência por daysOfWeekMask)', () => {
    let queryBuilder: {
      innerJoinAndSelect: jest.Mock;
      where: jest.Mock;
      andWhere: jest.Mock;
      getMany: jest.Mock;
    };

    beforeEach(() => {
      queryBuilder = {
        innerJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };
      schedulesRepo.createQueryBuilder.mockReturnValue(queryBuilder);
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('cria log PENDING só pra schedule cujo mask inclui o dia de hoje (sexta, bit 32)', async () => {
      const everyDay = buildSchedule({ id: 'sched-all', time: '08:30' });
      const weekendOnly = buildSchedule({ id: 'sched-weekend', daysOfWeekMask: 65 }); // dom+sáb
      queryBuilder.getMany.mockResolvedValue([everyDay, weekendOnly]);

      const created = await service.createTodayLogs();

      expect(created).toBe(1);
      expect(doseLogsRepo.create).toHaveBeenCalledTimes(1);
      expect(doseLogsRepo.create).toHaveBeenCalledWith({
        medicationId: 'med-1',
        scheduleId: 'sched-all',
        babyId: 'baby-1',
        familyId: 'family-1',
        // scheduledFor = hoje 00:00 UTC + hh:mm do schedule
        scheduledFor: new Date('2026-08-07T08:30:00.000Z'),
        status: DoseStatus.PENDING,
      });
    });

    it('filtra por período do tratamento usando a data de hoje (start_date <= hoje <= end_date)', async () => {
      await service.createTodayLogs();

      expect(queryBuilder.andWhere).toHaveBeenCalledWith('med.start_date <= :today', {
        today: '2026-08-07',
      });
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '(med.end_date IS NULL OR med.end_date >= :today)',
        { today: '2026-08-07' },
      );
    });

    it('unique violation (23505) é idempotência esperada: não conta nem loga erro', async () => {
      queryBuilder.getMany.mockResolvedValue([buildSchedule()]);
      doseLogsRepo.save.mockRejectedValue(
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      );

      const created = await service.createTodayLogs();

      expect(created).toBe(0);
      expect(Logger.prototype.error).not.toHaveBeenCalled();
    });

    it('outros erros de save são logados e não derrubam o lote', async () => {
      const failing = buildSchedule({ id: 'sched-fail' });
      const ok = buildSchedule({ id: 'sched-ok', time: '20:00' });
      queryBuilder.getMany.mockResolvedValue([failing, ok]);
      doseLogsRepo.save
        .mockRejectedValueOnce(new Error('connection reset'))
        .mockImplementation(async (x) => x);

      const created = await service.createTodayLogs();

      expect(created).toBe(1); // só o segundo entrou
      expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining('sched-fail'));
    });
  });
});
