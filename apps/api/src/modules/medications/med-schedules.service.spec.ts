import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DoseUnit } from '../../common/enums/dose-unit.enum';
import { MedSchedule } from './entities/med-schedule.entity';
import { Medication } from './entities/medication.entity';
import { MedSchedulesService } from './med-schedules.service';

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
    time: '08:00',
    daysOfWeekMask: 127,
    useAlarm: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as MedSchedule;
}

describe('MedSchedulesService', () => {
  let service: MedSchedulesService;
  let schedulesRepo: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    remove: jest.Mock;
  };
  let medicationsRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    schedulesRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      findOne: jest.fn(),
      remove: jest.fn(async () => undefined),
    };
    medicationsRepo = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        MedSchedulesService,
        { provide: getRepositoryToken(MedSchedule), useValue: schedulesRepo },
        { provide: getRepositoryToken(Medication), useValue: medicationsRepo },
      ],
    }).compile();

    service = module.get(MedSchedulesService);
  });

  describe('create', () => {
    it('lança NotFound quando o remédio não existe', async () => {
      medicationsRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('med-x', 'baby-1', 'family-1', { time: '08:00', daysOfWeekMask: 127 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lança Forbidden quando o remédio é de outro bebê/família', async () => {
      medicationsRepo.findOne.mockResolvedValue(buildMedication({ familyId: 'outra-familia' }));

      await expect(
        service.create('med-1', 'baby-1', 'family-1', { time: '08:00', daysOfWeekMask: 127 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(schedulesRepo.save).not.toHaveBeenCalled();
    });

    it('cria horário com defaults useAlarm=true e isActive=true', async () => {
      medicationsRepo.findOne.mockResolvedValue(buildMedication());

      await service.create('med-1', 'baby-1', 'family-1', {
        time: '14:30',
        daysOfWeekMask: 62, // só dias úteis
      });

      expect(schedulesRepo.create).toHaveBeenCalledWith({
        medicationId: 'med-1',
        time: '14:30',
        daysOfWeekMask: 62,
        useAlarm: true,
        isActive: true,
      });
      expect(schedulesRepo.save).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('lança NotFound quando o horário não existe', async () => {
      schedulesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('sched-x', 'med-1', 'baby-1', 'family-1', { time: '09:00' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lança Forbidden quando o horário pertence a outro remédio', async () => {
      schedulesRepo.findOne.mockResolvedValue(buildSchedule({ medicationId: 'outro-med' }));

      await expect(
        service.update('sched-1', 'med-1', 'baby-1', 'family-1', { time: '09:00' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lança Forbidden quando o remédio do horário é de outra família (escopo profundo)', async () => {
      schedulesRepo.findOne.mockResolvedValue(
        buildSchedule({ medication: buildMedication({ familyId: 'outra-familia' }) }),
      );

      await expect(
        service.update('sched-1', 'med-1', 'baby-1', 'family-1', { time: '09:00' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('aplica só os campos enviados (pausar horário sem mexer no resto)', async () => {
      schedulesRepo.findOne.mockResolvedValue(buildSchedule());

      const updated = await service.update('sched-1', 'med-1', 'baby-1', 'family-1', {
        isActive: false,
      });

      expect(updated.isActive).toBe(false);
      expect(updated.time).toBe('08:00'); // inalterado
      expect(updated.daysOfWeekMask).toBe(127); // inalterado
      expect(updated.useAlarm).toBe(true); // inalterado
    });
  });

  describe('remove', () => {
    it('faz hard delete (schedule é efêmero; histórico fica nos dose logs)', async () => {
      const schedule = buildSchedule();
      schedulesRepo.findOne.mockResolvedValue(schedule);

      await service.remove('sched-1', 'med-1', 'baby-1', 'family-1');

      expect(schedulesRepo.remove).toHaveBeenCalledWith(schedule);
    });

    it('não remove horário de outro escopo', async () => {
      schedulesRepo.findOne.mockResolvedValue(
        buildSchedule({ medication: buildMedication({ babyId: 'outro-baby' }) }),
      );

      await expect(service.remove('sched-1', 'med-1', 'baby-1', 'family-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(schedulesRepo.remove).not.toHaveBeenCalled();
    });
  });
});
