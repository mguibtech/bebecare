import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AppointmentsReminderJob } from '../src/modules/appointments/jobs/appointments-reminder.job';
import { MedDoseAlarmsJob } from '../src/modules/medications/jobs/med-dose-alarms.job';
import { MedDoseLogsService } from '../src/modules/medications/med-dose-logs.service';
import { PUSH_SENDER } from '../src/modules/notifications/senders/push-sender';
import { StubSender } from '../src/modules/notifications/senders/stub.sender';

// REQUER Postgres + migrations. Mocka apenas o PUSH_SENDER pra capturar envios.
describe('Notifications / push (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;
  let stub: StubSender;
  let reminderJob: AppointmentsReminderJob;
  let alarmsJob: MedDoseAlarmsJob;
  let doseLogsService: MedDoseLogsService;

  const stamp = Date.now();
  const mguibEmail = `notif-mguib-${stamp}@example.com`;
  const partnerEmail = `notif-partner-${stamp}@example.com`;
  const password = 'senhaSegura123';

  let mguibToken: string;
  let partnerToken: string;
  let babyId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      // Substitui o sender real por um stub controlado — assim os testes
      // capturam o que SERIA enviado, sem depender de Firebase real.
      .overrideProvider(PUSH_SENDER)
      .useValue(new StubSender())
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    http = app.getHttpServer();

    stub = app.get(PUSH_SENDER);
    reminderJob = app.get(AppointmentsReminderJob);
    alarmsJob = app.get(MedDoseAlarmsJob);
    doseLogsService = app.get(MedDoseLogsService);

    // Setup: dois users na mesma família.
    const r1 = await request(http)
      .post('/api/auth/register')
      .send({ email: mguibEmail, name: 'Mguib', password })
      .expect(201);
    mguibToken = r1.body.accessToken;

    // Cria convite e Partner entra na mesma família
    const inv = await request(http)
      .post('/api/families/me/invites')
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(201);

    const r2 = await request(http)
      .post('/api/auth/register')
      .send({ email: partnerEmail, name: 'Partner', password, inviteCode: inv.body.code })
      .expect(201);
    partnerToken = r2.body.accessToken;

    // Ambos registram fcm_token (mobile faria isso após login)
    await request(http)
      .put('/api/users/me/fcm-token')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ fcmToken: 'fcm-token-mguib-device' })
      .expect(204);
    await request(http)
      .put('/api/users/me/fcm-token')
      .set('Authorization', `Bearer ${partnerToken}`)
      .send({ fcmToken: 'fcm-token-partner-device' })
      .expect(204);

    // Bebê comum
    const baby = await request(http)
      .post('/api/babies')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ name: 'Theo', sex: 'male', birthDate: '2025-08-25' })
      .expect(201);
    babyId = baby.body.id;
  });

  afterAll(async () => {
    if (app) {
      const ds = app.get(DataSource);
      const emails = [mguibEmail, partnerEmail];
      const families = await ds.query(
        `SELECT family_id FROM users WHERE email = ANY($1::varchar[])`,
        [emails],
      );
      // Ordem importa: tudo que referencia users/families primeiro,
      // depois users, por último families. FKs sem CASCADE no family_invites
      // exigem essa ordem.
      await ds.query(
        `DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1::varchar[]))`,
        [emails],
      );
      if (families.length > 0) {
        const ids = families.map((r: any) => r.family_id);
        await ds.query(`DELETE FROM family_invites WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM med_dose_logs WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(
          `DELETE FROM med_schedules WHERE medication_id IN (SELECT id FROM medications WHERE family_id = ANY($1::uuid[]))`,
          [ids],
        );
        await ds.query(`DELETE FROM medications WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM appointments WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM babies WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM users WHERE email = ANY($1::varchar[])`, [emails]);
        await ds.query(`DELETE FROM families WHERE id = ANY($1::uuid[])`, [ids]);
      } else {
        await ds.query(`DELETE FROM users WHERE email = ANY($1::varchar[])`, [emails]);
      }
      await app.close();
    }
  });

  beforeEach(() => {
    stub.reset();
  });

  // -----------------------------------------------------------------
  // Lembretes de consulta
  // -----------------------------------------------------------------
  describe('AppointmentsReminderJob', () => {
    let apptInWindowId: string;

    it('Cron envia push para ambos os membros quando consulta entra na janela', async () => {
      // Consulta daqui a 30min, com reminder de 60min → janela já aberta.
      const future = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      const res = await request(http)
        .post(`/api/babies/${babyId}/appointments`)
        .set('Authorization', `Bearer ${mguibToken}`)
        .send({
          title: 'Pediatra',
          doctorName: 'Dra. Ana',
          location: 'Manaus',
          scheduledAt: future,
          reminderMinutesBefore: 60,
        })
        .expect(201);
      apptInWindowId = res.body.id;

      const sent = await reminderJob.runOnce();
      expect(sent).toBe(1);

      // 1 chamada de sender com 2 tokens (mguib + partner)
      expect(stub.sent).toHaveLength(1);
      expect(stub.sent[0].tokens.sort()).toEqual(
        ['fcm-token-mguib-device', 'fcm-token-partner-device'].sort(),
      );
      expect(stub.sent[0].payload.title).toContain('Pediatra');
      expect(stub.sent[0].payload.data).toMatchObject({
        type: 'appointment',
        id: apptInWindowId,
      });
    });

    it('Cron rodando 2x não reenvia (notified_at já setado)', async () => {
      const sent = await reminderJob.runOnce();
      expect(sent).toBe(0);
      expect(stub.sent).toHaveLength(0);
    });

    it('Consulta fora da janela (reminder ainda não abriu) não é enviada', async () => {
      // Consulta daqui a 2h, reminder de 30min → janela só abre daqui a 1h30
      const future = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      await request(http)
        .post(`/api/babies/${babyId}/appointments`)
        .set('Authorization', `Bearer ${mguibToken}`)
        .send({
          title: 'Fora da janela',
          scheduledAt: future,
          reminderMinutesBefore: 30,
        })
        .expect(201);

      const sent = await reminderJob.runOnce();
      expect(sent).toBe(0);
    });

    it('Consulta com reminderEnabled=false não é enviada', async () => {
      const future = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await request(http)
        .post(`/api/babies/${babyId}/appointments`)
        .set('Authorization', `Bearer ${mguibToken}`)
        .send({
          title: 'Sem lembrete',
          scheduledAt: future,
          reminderMinutesBefore: 60,
          reminderEnabled: false,
        })
        .expect(201);

      const sent = await reminderJob.runOnce();
      expect(sent).toBe(0);
    });
  });

  // -----------------------------------------------------------------
  // Alarmes de dose
  // -----------------------------------------------------------------
  describe('MedDoseAlarmsJob', () => {
    let medId: string;
    let scheduleAlarmOnId: string;

    it('Setup: cria remédio com schedule useAlarm=true no horário atual', async () => {
      const med = await request(http)
        .post(`/api/babies/${babyId}/medications`)
        .set('Authorization', `Bearer ${mguibToken}`)
        .send({
          name: 'Vitamina D',
          dose: 1,
          doseUnit: 'drop',
          instructions: 'Junto com leite',
          startDate: '2025-01-01',
        })
        .expect(201);
      medId = med.body.id;

      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');

      const sched = await request(http)
        .post(`/api/babies/${babyId}/medications/${medId}/schedules`)
        .set('Authorization', `Bearer ${mguibToken}`)
        .send({ time: `${hh}:${mm}`, daysOfWeekMask: 127, useAlarm: true })
        .expect(201);
      scheduleAlarmOnId = sched.body.id;
      expect(scheduleAlarmOnId).toBeDefined();

      // Gera o dose log de hoje
      const created = await doseLogsService.createTodayLogs();
      expect(created).toBeGreaterThan(0);
    });

    it('Cron envia alarme quando dose pending tá na janela ±1min', async () => {
      const sent = await alarmsJob.runOnce();
      expect(sent).toBeGreaterThanOrEqual(1);

      expect(stub.sent.length).toBeGreaterThanOrEqual(1);
      const call = stub.sent.find((s) => s.payload.title.includes('Vitamina D'));
      expect(call).toBeDefined();
      expect(call!.payload.body).toContain('drop');
      expect(call!.payload.data).toMatchObject({ type: 'dose' });
    });

    it('Cron rodando 2x não reenvia o mesmo alarme', async () => {
      const sent = await alarmsJob.runOnce();
      expect(sent).toBe(0);
    });

    it('Schedule com useAlarm=false não gera alarme (mesmo no horário)', async () => {
      // Cria outro schedule no mesmo horário mas sem alarme
      const now = new Date();
      const hh = String(now.getUTCHours()).padStart(2, '0');
      const mm = String(now.getUTCMinutes()).padStart(2, '0');

      const med2 = await request(http)
        .post(`/api/babies/${babyId}/medications`)
        .set('Authorization', `Bearer ${mguibToken}`)
        .send({
          name: 'Sem alarme',
          dose: 5,
          doseUnit: 'ml',
          startDate: '2025-01-01',
        })
        .expect(201);

      await request(http)
        .post(`/api/babies/${babyId}/medications/${med2.body.id}/schedules`)
        .set('Authorization', `Bearer ${mguibToken}`)
        .send({ time: `${hh}:${mm}`, daysOfWeekMask: 127, useAlarm: false })
        .expect(201);

      // Gera doses do novo schedule
      await doseLogsService.createTodayLogs();

      stub.reset();
      const sent = await alarmsJob.runOnce();
      // Nada pra enviar — o único schedule novo é useAlarm=false; o anterior já notified
      expect(sent).toBe(0);
      expect(stub.sent.find((s) => s.payload.title.includes('Sem alarme'))).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------
  // Limpeza de token inválido
  // -----------------------------------------------------------------
  describe('Cleanup de fcm_token inválido', () => {
    it('Mguib remove o token (PUT com fcmToken: null)', async () => {
      await request(http)
        .put('/api/users/me/fcm-token')
        .set('Authorization', `Bearer ${mguibToken}`)
        .send({ fcmToken: null })
        .expect(204);

      const me = await request(http)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${mguibToken}`)
        .expect(200);
      // UserPublicDto não expõe fcmToken — confirma indiretamente via novo envio
      expect(me.body).toBeDefined();
    });

    it('Próximo envio só vai pro Partner (Mguib sem token)', async () => {
      const future = new Date(Date.now() + 30 * 60 * 1000).toISOString();
      await request(http)
        .post(`/api/babies/${babyId}/appointments`)
        .set('Authorization', `Bearer ${mguibToken}`)
        .send({
          title: 'Pós-cleanup',
          scheduledAt: future,
          reminderMinutesBefore: 60,
        })
        .expect(201);

      stub.reset();
      await reminderJob.runOnce();

      const call = stub.sent.find((s) => s.payload.title.includes('Pós-cleanup'));
      expect(call).toBeDefined();
      expect(call!.tokens).toEqual(['fcm-token-partner-device']);
    });
  });
});
