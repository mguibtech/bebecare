import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { NotificationsService } from '../../notifications/notifications.service';
import { Appointment } from '../entities/appointment.entity';
import { AppointmentsReminderJob } from './appointments-reminder.job';

// "Agora" fixo: 07/08/2026 12:00 UTC (08:00 em Manaus, UTC-4).
const NOW = new Date('2026-08-07T12:00:00.000Z');

function buildAppointment(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: 'appt-1',
    babyId: 'baby-1',
    familyId: 'family-1',
    title: 'Puericultura',
    doctorName: null,
    specialty: null,
    // 24h depois de NOW — dentro da janela do lembrete default (1440 min)
    scheduledAt: new Date('2026-08-08T12:00:00.000Z'),
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

describe('AppointmentsReminderJob', () => {
  let job: AppointmentsReminderJob;
  let repo: { createQueryBuilder: jest.Mock; save: jest.Mock };
  let notifications: { sendToFamily: jest.Mock };
  let queryBuilder: {
    where: jest.Mock;
    andWhere: jest.Mock;
    getMany: jest.Mock;
  };

  beforeAll(() => {
    jest.useFakeTimers({ now: NOW });
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    queryBuilder = {
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
    };
    repo = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn(async (x) => x),
    };
    notifications = { sendToFamily: jest.fn().mockResolvedValue(undefined) };

    // Silencia o logger do job (e permite asserts nos erros)
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);

    const module = await Test.createTestingModule({
      providers: [
        AppointmentsReminderJob,
        { provide: getRepositoryToken(Appointment), useValue: repo },
        { provide: NotificationsService, useValue: notifications },
      ],
    }).compile();

    job = module.get(AppointmentsReminderJob);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sem consultas na janela: não envia nada e retorna 0', async () => {
    await expect(job.runOnce()).resolves.toBe(0);
    expect(notifications.sendToFamily).not.toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('a query filtra só não-notificadas (idempotência), SCHEDULED, com lembrete ligado e futuras', async () => {
    await job.runOnce();

    // Consulta já notificada NÃO pode voltar — é o notified_at IS NULL que garante
    expect(queryBuilder.where).toHaveBeenCalledWith('a.notified_at IS NULL');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('a.status = :status', {
      status: AppointmentStatus.SCHEDULED,
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('a.reminder_enabled = true');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('a.deleted_at IS NULL');
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('a.scheduled_at > NOW()');
    // Janela do offset configurável (reminder_minutes_before) fica no SQL
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      `a.scheduled_at - (a.reminder_minutes_before * INTERVAL '1 minute') <= NOW()`,
    );
  });

  it('envia push pra família e marca notified_at (idempotência pro próximo tick)', async () => {
    const appt = buildAppointment();
    queryBuilder.getMany.mockResolvedValue([appt]);

    const sent = await job.runOnce();

    expect(sent).toBe(1);
    expect(notifications.sendToFamily).toHaveBeenCalledWith('family-1', {
      title: 'Lembrete: Puericultura',
      body: expect.any(String),
      data: { type: 'appointment', id: 'appt-1' },
    });
    // Marca notified_at = agora e persiste
    expect(appt.notifiedAt).toEqual(NOW);
    expect(repo.save).toHaveBeenCalledWith(appt);
  });

  it('corpo do push traz horário em Manaus (UTC-4), médico e local quando presentes', async () => {
    const appt = buildAppointment({
      // 18:30 UTC = 14:30 em Manaus
      scheduledAt: new Date('2026-08-08T18:30:00.000Z'),
      doctorName: 'Dra. Ana',
      location: 'Clínica Vida',
    });
    queryBuilder.getMany.mockResolvedValue([appt]);

    await job.runOnce();

    const payload = notifications.sendToFamily.mock.calls[0][1];
    expect(payload.body).toContain('08/08');
    expect(payload.body).toContain('14:30');
    expect(payload.body).toContain('com Dra. Ana');
    expect(payload.body).toContain('em Clínica Vida');
  });

  it('corpo do push omite médico/local quando não informados', async () => {
    const appt = buildAppointment();
    queryBuilder.getMany.mockResolvedValue([appt]);

    await job.runOnce();

    const payload = notifications.sendToFamily.mock.calls[0][1];
    expect(payload.body).not.toContain(' com ');
    expect(payload.body).not.toContain(' em ');
  });

  it('falha de push NÃO marca notified_at — próxima rodada tenta de novo', async () => {
    const failing = buildAppointment({ id: 'appt-fail', familyId: 'family-fail' });
    const ok = buildAppointment({ id: 'appt-ok', familyId: 'family-ok' });
    queryBuilder.getMany.mockResolvedValue([failing, ok]);
    notifications.sendToFamily
      .mockRejectedValueOnce(new Error('Firebase fora do ar'))
      .mockResolvedValueOnce(undefined);

    const sent = await job.runOnce();

    // A que falhou não conta e continua elegível (notifiedAt null, sem save)
    expect(sent).toBe(1);
    expect(failing.notifiedAt).toBeNull();
    expect(repo.save).toHaveBeenCalledTimes(1);
    expect(repo.save).toHaveBeenCalledWith(ok);
    expect(ok.notifiedAt).toEqual(NOW);
    // Erro é logado, não propagado (uma consulta ruim não derruba o lote)
    expect(Logger.prototype.error).toHaveBeenCalledWith(expect.stringContaining('appt-fail'));
  });

  it('falha ao salvar notified_at também não derruba o lote nem conta como enviada', async () => {
    const appt = buildAppointment();
    queryBuilder.getMany.mockResolvedValue([appt]);
    repo.save.mockRejectedValue(new Error('db down'));

    await expect(job.runOnce()).resolves.toBe(0);
    expect(Logger.prototype.error).toHaveBeenCalled();
  });

  it('sendReminders delega pro runOnce (entrada do cron de 5 em 5 min)', async () => {
    const runOnceSpy = jest.spyOn(job, 'runOnce').mockResolvedValue(2);

    await job.sendReminders();

    expect(runOnceSpy).toHaveBeenCalledTimes(1);
  });
});
