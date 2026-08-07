import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AlarmCategory } from '../../common/enums/alarm-category.enum';
import { AlarmsService } from './alarms.service';
import { Alarm } from './entities/alarm.entity';

function buildAlarm(overrides: Partial<Alarm> = {}): Alarm {
  return {
    id: 'alarm-1',
    userId: 'user-1',
    label: 'Mamada',
    time: '06:00',
    daysOfWeekMask: 127,
    category: AlarmCategory.FEEDING,
    soundKey: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    assignUuid: () => undefined,
    ...overrides,
    // `as unknown as` porque o literal não deriva de BaseEntity (assignUuid é
    // protected) — sem isso o `tsc --noEmit` acusa TS2352.
  } as unknown as Alarm;
}

describe('AlarmsService', () => {
  let service: AlarmsService;
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
      providers: [AlarmsService, { provide: getRepositoryToken(Alarm), useValue: repo }],
    }).compile();

    service = module.get(AlarmsService);
  });

  it('create: associa ao userId e trim no label/soundKey', async () => {
    await service.create('user-1', {
      label: '  Mamada da manhã  ',
      time: '06:00',
      daysOfWeekMask: 127,
      category: AlarmCategory.FEEDING,
      soundKey: '  ',
      isActive: true,
    });

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        label: 'Mamada da manhã',
        soundKey: null, // string vazia após trim vira null
      }),
    );
    expect(repo.save).toHaveBeenCalled();
  });

  it('findOne: lança NotFound quando não existe', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findOne('x', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('findOne: lança Forbidden quando é de outro usuário', async () => {
    repo.findOne.mockResolvedValue(buildAlarm({ userId: 'outro' }));
    await expect(service.findOne('alarm-1', 'user-1')).rejects.toThrow(ForbiddenException);
  });

  it('update: aplica só os campos enviados', async () => {
    repo.findOne.mockResolvedValue(buildAlarm());
    const updated = await service.update('alarm-1', 'user-1', {
      isActive: false,
    });
    expect(updated.isActive).toBe(false);
    expect(updated.label).toBe('Mamada'); // inalterado
  });

  it('remove: soft-remove do alarme do próprio usuário', async () => {
    const alarm = buildAlarm();
    repo.findOne.mockResolvedValue(alarm);
    await service.remove('alarm-1', 'user-1');
    expect(repo.softRemove).toHaveBeenCalledWith(alarm);
  });
});
