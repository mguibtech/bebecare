import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, LessThan, MoreThanOrEqual } from 'typeorm';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { Baby } from '../babies/entities/baby.entity';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';

// Data "agora" fixa para os testes — evita flakiness em asserts de datas.
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

function buildAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'appt-1',
    babyId: 'baby-1',
    familyId: 'family-1',
    title: 'Puericultura',
    doctorName: null,
    specialty: null,
    scheduledAt: new Date('2026-08-10T14:00:00.000Z'),
    location: null,
    notes: null,
    status: AppointmentStatus.SCHEDULED,
    reminderEnabled: true,
    reminderMinutesBefore: 1440,
    completedAt: null,
    completedNotes: null,
    canceledAt: null,
    cancelReason: null,
    notifiedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    assignUuid: () => undefined,
    ...overrides,
  } as unknown as Appointment;
}

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentsRepo: {
    create: jest.Mock;
    save: jest.Mock;
    find: jest.Mock;
    findOne: jest.Mock;
    softRemove: jest.Mock;
    createQueryBuilder: jest.Mock;
  };
  let babiesRepo: { findOne: jest.Mock };

  beforeAll(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    appointmentsRepo = {
      create: jest.fn((x) => x),
      save: jest.fn(async (x) => x),
      find: jest.fn(async () => []),
      findOne: jest.fn(),
      softRemove: jest.fn(async () => undefined),
      createQueryBuilder: jest.fn(),
    };
    babiesRepo = { findOne: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: appointmentsRepo },
        { provide: getRepositoryToken(Baby), useValue: babiesRepo },
      ],
    }).compile();

    service = module.get(AppointmentsService);
  });

  describe('create', () => {
    it('lança NotFound quando o bebê não existe', async () => {
      babiesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create('baby-x', 'family-1', {
          title: 'Consulta',
          scheduledAt: '2026-09-01T14:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(appointmentsRepo.save).not.toHaveBeenCalled();
    });

    it('lança Forbidden quando o bebê é de outra família', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby({ familyId: 'outra-familia' }));

      await expect(
        service.create('baby-1', 'family-1', {
          title: 'Consulta',
          scheduledAt: '2026-09-01T14:00:00.000Z',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lança BadRequest quando scheduledAt não é uma data válida', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());

      await expect(
        service.create('baby-1', 'family-1', {
          title: 'Consulta',
          scheduledAt: 'nao-e-data',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('consulta futura nasce SCHEDULED com defaults de lembrete e campos trimados', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());

      await service.create('baby-1', 'family-1', {
        title: '  Puericultura  ',
        scheduledAt: '2026-09-01T14:00:00.000Z',
        doctorName: '   ', // só espaços → deve virar null
        location: ' Clínica Vida ',
      });

      expect(appointmentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          babyId: 'baby-1',
          familyId: 'family-1',
          title: 'Puericultura',
          doctorName: null,
          location: 'Clínica Vida',
          status: AppointmentStatus.SCHEDULED,
          completedAt: null,
          reminderEnabled: true, // default
          reminderMinutesBefore: 1440, // default 24h
        }),
      );
      expect(appointmentsRepo.save).toHaveBeenCalled();
    });

    it('consulta no passado nasce COMPLETED com completedAt = agora (importar histórico)', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());

      await service.create('baby-1', 'family-1', {
        title: 'Consulta antiga',
        scheduledAt: '2026-01-15T14:00:00.000Z', // antes de NOW
      });

      expect(appointmentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: AppointmentStatus.COMPLETED,
          completedAt: NOW,
        }),
      );
    });
  });

  describe('findByBaby', () => {
    beforeEach(() => {
      babiesRepo.findOne.mockResolvedValue(buildBaby());
    });

    it('scope=upcoming filtra scheduledAt >= agora e ordena ASC', async () => {
      await service.findByBaby('baby-1', 'family-1', { scope: 'upcoming' });

      expect(appointmentsRepo.find).toHaveBeenCalledWith({
        where: { babyId: 'baby-1', scheduledAt: MoreThanOrEqual(NOW) },
        order: { scheduledAt: 'ASC' },
      });
    });

    it('scope=past filtra scheduledAt < agora e ordena DESC (mais recente primeiro)', async () => {
      await service.findByBaby('baby-1', 'family-1', { scope: 'past' });

      expect(appointmentsRepo.find).toHaveBeenCalledWith({
        where: { babyId: 'baby-1', scheduledAt: LessThan(NOW) },
        order: { scheduledAt: 'DESC' },
      });
    });

    it('range from/to explícito vira Between e sobrescreve o scope', async () => {
      const from = '2026-08-01T00:00:00.000Z';
      const to = '2026-08-31T23:59:59.000Z';

      await service.findByBaby('baby-1', 'family-1', { scope: 'upcoming', from, to });

      const options = appointmentsRepo.find.mock.calls[0][0];
      expect(options.where.scheduledAt).toEqual(Between(new Date(from), new Date(to)));
    });

    it('só "to" (sem from) vira Between desde a época zero', async () => {
      const to = '2026-08-31T23:59:59.000Z';

      await service.findByBaby('baby-1', 'family-1', { to });

      const options = appointmentsRepo.find.mock.calls[0][0];
      expect(options.where.scheduledAt).toEqual(Between(new Date(0), new Date(to)));
    });

    it('filtro de status é repassado ao where', async () => {
      await service.findByBaby('baby-1', 'family-1', { status: AppointmentStatus.CANCELED });

      const options = appointmentsRepo.find.mock.calls[0][0];
      expect(options.where.status).toBe(AppointmentStatus.CANCELED);
    });

    it('valida o escopo do bebê antes de listar', async () => {
      babiesRepo.findOne.mockResolvedValue(buildBaby({ familyId: 'outra-familia' }));

      await expect(service.findByBaby('baby-1', 'family-1', {})).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(appointmentsRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('lança NotFound quando a consulta não existe', async () => {
      appointmentsRepo.findOne.mockResolvedValue(null);

      await expect(service.findOne('appt-x', 'baby-1', 'family-1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lança Forbidden quando a consulta é de outro bebê', async () => {
      appointmentsRepo.findOne.mockResolvedValue(buildAppointment({ babyId: 'outro-baby' }));

      await expect(service.findOne('appt-1', 'baby-1', 'family-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('lança Forbidden quando a consulta é de outra família', async () => {
      appointmentsRepo.findOne.mockResolvedValue(buildAppointment({ familyId: 'outra-familia' }));

      await expect(service.findOne('appt-1', 'baby-1', 'family-1')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('aplica só os campos enviados e mantém o resto', async () => {
      appointmentsRepo.findOne.mockResolvedValue(
        buildAppointment({ doctorName: 'Dra. Ana', notes: 'Levar exames' }),
      );

      const updated = await service.update('appt-1', 'baby-1', 'family-1', {
        location: ' Nova Clínica ',
      });

      expect(updated.location).toBe('Nova Clínica');
      expect(updated.doctorName).toBe('Dra. Ana'); // inalterado
      expect(updated.notes).toBe('Levar exames'); // inalterado
    });

    it('string vazia em campo opcional limpa o valor (vira null)', async () => {
      appointmentsRepo.findOne.mockResolvedValue(buildAppointment({ doctorName: 'Dra. Ana' }));

      const updated = await service.update('appt-1', 'baby-1', 'family-1', { doctorName: '' });

      expect(updated.doctorName).toBeNull();
    });
  });

  describe('complete', () => {
    it('marca como COMPLETED com completedAt e notas trimadas', async () => {
      appointmentsRepo.findOne.mockResolvedValue(buildAppointment());

      const result = await service.complete('appt-1', 'baby-1', 'family-1', {
        notes: '  Tudo certo, peso ok  ',
      });

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
      expect(result.completedAt).toEqual(NOW);
      expect(result.completedNotes).toBe('Tudo certo, peso ok');
    });

    it('lança BadRequest ao completar consulta CANCELED', async () => {
      appointmentsRepo.findOne.mockResolvedValue(
        buildAppointment({ status: AppointmentStatus.CANCELED }),
      );

      await expect(service.complete('appt-1', 'baby-1', 'family-1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(appointmentsRepo.save).not.toHaveBeenCalled();
    });

    it('permite completar consulta MISSED (user marcou atrasado)', async () => {
      appointmentsRepo.findOne.mockResolvedValue(
        buildAppointment({ status: AppointmentStatus.MISSED }),
      );

      const result = await service.complete('appt-1', 'baby-1', 'family-1', {});

      expect(result.status).toBe(AppointmentStatus.COMPLETED);
    });
  });

  describe('cancel', () => {
    it('marca como CANCELED com canceledAt e motivo trimado', async () => {
      appointmentsRepo.findOne.mockResolvedValue(buildAppointment());

      const result = await service.cancel('appt-1', 'baby-1', 'family-1', {
        reason: '  Bebê gripado  ',
      });

      expect(result.status).toBe(AppointmentStatus.CANCELED);
      expect(result.canceledAt).toEqual(NOW);
      expect(result.cancelReason).toBe('Bebê gripado');
    });

    it('lança BadRequest ao cancelar consulta já COMPLETED', async () => {
      appointmentsRepo.findOne.mockResolvedValue(
        buildAppointment({ status: AppointmentStatus.COMPLETED }),
      );

      await expect(service.cancel('appt-1', 'baby-1', 'family-1', {})).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('faz soft-remove da consulta do próprio escopo', async () => {
      const appt = buildAppointment();
      appointmentsRepo.findOne.mockResolvedValue(appt);

      await service.remove('appt-1', 'baby-1', 'family-1');

      expect(appointmentsRepo.softRemove).toHaveBeenCalledWith(appt);
    });
  });

  describe('markPastDueAsMissed', () => {
    function buildQueryBuilderMock(affected: number | undefined) {
      const qb = {
        update: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValue({ affected }),
      };
      appointmentsRepo.createQueryBuilder.mockReturnValue(qb);
      return qb;
    }

    it('marca SCHEDULED antigas como MISSED com cutoff = agora - graceHours', async () => {
      const qb = buildQueryBuilderMock(3);

      const count = await service.markPastDueAsMissed(24);

      expect(count).toBe(3);
      expect(qb.set).toHaveBeenCalledWith({ status: AppointmentStatus.MISSED });
      expect(qb.where).toHaveBeenCalledWith('status = :scheduled', {
        scheduled: AppointmentStatus.SCHEDULED,
      });
      // Cutoff exato: NOW - 24h
      const expectedCutoff = new Date(NOW.getTime() - 24 * 3600 * 1000);
      expect(qb.andWhere).toHaveBeenCalledWith('scheduled_at < :cutoff', {
        cutoff: expectedCutoff,
      });
      // Soft-deletadas ficam de fora
      expect(qb.andWhere).toHaveBeenCalledWith('deleted_at IS NULL');
    });

    it('retorna 0 quando o driver não informa affected', async () => {
      buildQueryBuilderMock(undefined);

      await expect(service.markPastDueAsMissed()).resolves.toBe(0);
    });
  });
});
