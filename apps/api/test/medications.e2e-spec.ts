import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { MedDoseLogsService } from '../src/modules/medications/med-dose-logs.service';

// REQUER Postgres + migrations.
describe('Medications + doses (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;
  let doseLogsService: MedDoseLogsService;

  const stamp = Date.now();
  const mguibEmail = `med-mguib-${stamp}@example.com`;
  const intrusoEmail = `med-intruso-${stamp}@example.com`;
  const password = 'senhaSegura123';

  let mguibToken: string;
  let intrusoToken: string;
  let babyId: string;
  let intrusoBabyId: string;
  let medId: string;
  let scheduleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    http = app.getHttpServer();
    doseLogsService = app.get(MedDoseLogsService);

    const r1 = await request(http)
      .post('/api/auth/register')
      .send({ email: mguibEmail, name: 'Mguib', password })
      .expect(201);
    mguibToken = r1.body.accessToken;

    const r2 = await request(http)
      .post('/api/auth/register')
      .send({ email: intrusoEmail, name: 'Intruso', password })
      .expect(201);
    intrusoToken = r2.body.accessToken;

    const baby = await request(http)
      .post('/api/babies')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ name: 'Theo', sex: 'male', birthDate: '2025-08-25' })
      .expect(201);
    babyId = baby.body.id;

    const ibaby = await request(http)
      .post('/api/babies')
      .set('Authorization', `Bearer ${intrusoToken}`)
      .send({ name: 'Outro', sex: 'female', birthDate: '2024-01-10' })
      .expect(201);
    intrusoBabyId = ibaby.body.id;
  });

  afterAll(async () => {
    if (app) {
      const ds = app.get(DataSource);
      const emails = [mguibEmail, intrusoEmail];
      await ds.query(
        `DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = ANY($1::varchar[]))`,
        [emails],
      );
      const families = await ds.query(
        `SELECT family_id FROM users WHERE email = ANY($1::varchar[])`,
        [emails],
      );
      await ds.query(`DELETE FROM users WHERE email = ANY($1::varchar[])`, [emails]);
      if (families.length > 0) {
        const ids = families.map((r: any) => r.family_id);
        await ds.query(`DELETE FROM med_dose_logs WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(
          `DELETE FROM med_schedules WHERE medication_id IN (SELECT id FROM medications WHERE family_id = ANY($1::uuid[]))`,
          [ids],
        );
        await ds.query(`DELETE FROM medications WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM babies WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM families WHERE id = ANY($1::uuid[])`, [ids]);
      }
      await app.close();
    }
  });

  // ----------------------------------------------------------------
  // CRUD Medication
  // ----------------------------------------------------------------
  it('POST cria remédio com dose e instruções', async () => {
    const res = await request(http)
      .post(`/api/babies/${babyId}/medications`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        name: 'Vitamina D',
        dose: 1,
        doseUnit: 'drop',
        instructions: 'Junto com leite',
        startDate: '2026-05-25',
      })
      .expect(201);

    expect(res.body.name).toBe('Vitamina D');
    expect(res.body.dose).toBe('1.000');
    expect(res.body.doseUnit).toBe('drop');
    expect(res.body.isActive).toBe(true);
    expect(res.body.schedules).toEqual([]);
    medId = res.body.id;
  });

  it('GET lista remédios do bebê', async () => {
    const res = await request(http)
      .get(`/api/babies/${babyId}/medications`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);
    expect(res.body).toHaveLength(1);
  });

  it('Intruso não vê remédios alheios', async () => {
    await request(http)
      .get(`/api/babies/${babyId}/medications`)
      .set('Authorization', `Bearer ${intrusoToken}`)
      .expect(403);
  });

  // ----------------------------------------------------------------
  // Schedules
  // ----------------------------------------------------------------
  it('POST adiciona schedule diário com alarme', async () => {
    // Pega a hora atual + 1min pra garantir que cai no "hoje"
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');

    const res = await request(http)
      .post(`/api/babies/${babyId}/medications/${medId}/schedules`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        time: `${hh}:${mm}`,
        daysOfWeekMask: 127, // todos os dias
        useAlarm: true,
      })
      .expect(201);

    expect(res.body.useAlarm).toBe(true);
    expect(res.body.daysOfWeekNames).toHaveLength(7);
    scheduleId = res.body.id;
  });

  it('POST schedule rejeita time mal formatado', async () => {
    await request(http)
      .post(`/api/babies/${babyId}/medications/${medId}/schedules`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ time: '25:00', daysOfWeekMask: 127 })
      .expect(400);
  });

  it('POST schedule rejeita mask fora da faixa', async () => {
    await request(http)
      .post(`/api/babies/${babyId}/medications/${medId}/schedules`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ time: '08:00', daysOfWeekMask: 200 })
      .expect(400);
  });

  // ----------------------------------------------------------------
  // Doses (cron + take/skip)
  // ----------------------------------------------------------------
  it('Cron cria doses PENDING para hoje', async () => {
    // Chama o helper do service direto (mesmo método que o @Cron usaria)
    const created = await doseLogsService.createTodayLogs();
    expect(created).toBeGreaterThan(0);
  });

  it('GET /doses/today retorna a dose criada', async () => {
    const res = await request(http)
      .get(`/api/babies/${babyId}/doses/today`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
    const dose = res.body[0];
    expect(dose.status).toBe('pending');
    expect(dose.medication.name).toBe('Vitamina D');
  });

  it('POST /doses/:id/take muda status para TAKEN', async () => {
    const todayRes = await request(http)
      .get(`/api/babies/${babyId}/doses/today`)
      .set('Authorization', `Bearer ${mguibToken}`);
    const doseId = todayRes.body[0].id;

    const res = await request(http)
      .post(`/api/babies/${babyId}/doses/${doseId}/take`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    expect(res.body.status).toBe('taken');
    expect(res.body.takenAt).toBeDefined();
    expect(res.body.loggedByName).toBe('Mguib');
  });

  it('POST /doses/:id/skip em dose já TAKEN retorna 400', async () => {
    const todayRes = await request(http)
      .get(`/api/babies/${babyId}/doses/today`)
      .set('Authorization', `Bearer ${mguibToken}`);
    const doseId = todayRes.body[0].id;

    await request(http)
      .post(`/api/babies/${babyId}/doses/${doseId}/skip`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ reason: 'engano' })
      .expect(400);
  });

  it('POST /doses/:id/reset volta para PENDING', async () => {
    const todayRes = await request(http)
      .get(`/api/babies/${babyId}/doses/today`)
      .set('Authorization', `Bearer ${mguibToken}`);
    const doseId = todayRes.body[0].id;

    const res = await request(http)
      .post(`/api/babies/${babyId}/doses/${doseId}/reset`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    expect(res.body.status).toBe('pending');
    expect(res.body.takenAt).toBeNull();
  });

  it('Cron rodando 2x não duplica (UNIQUE schedule+scheduledFor)', async () => {
    const before = await doseLogsService.createTodayLogs();
    const after = await doseLogsService.createTodayLogs();
    // primeira pode ter criado mais (de testes anteriores), segunda deve criar 0
    expect(after).toBe(0);
    expect(before).toBeGreaterThanOrEqual(0);
  });

  it('Intruso não pode marcar dose alheia', async () => {
    const todayRes = await request(http)
      .get(`/api/babies/${babyId}/doses/today`)
      .set('Authorization', `Bearer ${mguibToken}`);
    const doseId = todayRes.body[0].id;

    await request(http)
      .post(`/api/babies/${babyId}/doses/${doseId}/take`)
      .set('Authorization', `Bearer ${intrusoToken}`)
      .expect(403);
  });

  // ----------------------------------------------------------------
  // Cleanup
  // ----------------------------------------------------------------
  it('DELETE schedule e remédio funcionam', async () => {
    await request(http)
      .delete(`/api/babies/${babyId}/medications/${medId}/schedules/${scheduleId}`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(204);

    await request(http)
      .delete(`/api/babies/${babyId}/medications/${medId}`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(204);
  });
});
