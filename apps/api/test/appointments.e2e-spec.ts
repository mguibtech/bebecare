import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

// REQUER Postgres + migrations + seed PNI aplicado.
describe('Appointments (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  const stamp = Date.now();
  const mguibEmail = `appt-mguib-${stamp}@example.com`;
  const intrusoEmail = `appt-intruso-${stamp}@example.com`;
  const password = 'senhaSegura123';

  let mguibToken: string;
  let intrusoToken: string;
  let babyId: string;
  let intrusoBabyId: string;

  // Helpers de data
  const isoFromNow = (daysOffset: number) => {
    const d = new Date(Date.now() + daysOffset * 86400 * 1000);
    return d.toISOString();
  };

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

    const intrusoBaby = await request(http)
      .post('/api/babies')
      .set('Authorization', `Bearer ${intrusoToken}`)
      .send({ name: 'Outro', sex: 'female', birthDate: '2024-01-10' })
      .expect(201);
    intrusoBabyId = intrusoBaby.body.id;
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
        await ds.query(`DELETE FROM appointments WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM babies WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM families WHERE id = ANY($1::uuid[])`, [ids]);
      }
      await app.close();
    }
  });

  // ----------------------------------------------------------------
  // CRUD
  // ----------------------------------------------------------------
  let futureApptId: string;
  let pastApptId: string;

  it('POST cria consulta futura com defaults de lembrete', async () => {
    const res = await request(http)
      .post(`/api/babies/${babyId}/appointments`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        title: 'Puericultura 9m',
        doctorName: 'Dra. Ana',
        specialty: 'Pediatra',
        scheduledAt: isoFromNow(7),
        location: 'Clínica Vida',
      })
      .expect(201);

    expect(res.body.status).toBe('scheduled');
    expect(res.body.reminderEnabled).toBe(true);
    expect(res.body.reminderMinutesBefore).toBe(1440);
    futureApptId = res.body.id;
  });

  it('POST com data passada cria já como COMPLETED', async () => {
    const res = await request(http)
      .post(`/api/babies/${babyId}/appointments`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        title: 'Consulta antiga',
        scheduledAt: isoFromNow(-30),
      })
      .expect(201);

    expect(res.body.status).toBe('completed');
    expect(res.body.completedAt).toBeDefined();
    pastApptId = res.body.id;
  });

  it('POST rejeita reminderMinutesBefore fora do whitelist', async () => {
    await request(http)
      .post(`/api/babies/${babyId}/appointments`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        title: 'Inválida',
        scheduledAt: isoFromNow(5),
        reminderMinutesBefore: 999, // não está em [30, 60, 180, 1440, 10080]
      })
      .expect(400);
  });

  // ----------------------------------------------------------------
  // Filters
  // ----------------------------------------------------------------
  it('GET sem filtros lista as 2 consultas', async () => {
    const res = await request(http)
      .get(`/api/babies/${babyId}/appointments`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);
    expect(res.body).toHaveLength(2);
  });

  it('GET ?scope=upcoming retorna só a futura', async () => {
    const res = await request(http)
      .get(`/api/babies/${babyId}/appointments?scope=upcoming`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(futureApptId);
  });

  it('GET ?scope=past retorna só a antiga', async () => {
    const res = await request(http)
      .get(`/api/babies/${babyId}/appointments?scope=past`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(pastApptId);
  });

  it('GET ?status=completed retorna só a completed', async () => {
    const res = await request(http)
      .get(`/api/babies/${babyId}/appointments?status=completed`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].status).toBe('completed');
  });

  // ----------------------------------------------------------------
  // Complete / Cancel
  // ----------------------------------------------------------------
  it('POST /complete marca como COMPLETED com notas pós-consulta', async () => {
    const res = await request(http)
      .post(`/api/babies/${babyId}/appointments/${futureApptId}/complete`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ notes: 'Peso 8.2kg, prescrita vitamina D' })
      .expect(200);

    expect(res.body.status).toBe('completed');
    expect(res.body.completedAt).toBeDefined();
    expect(res.body.completedNotes).toContain('vitamina D');
  });

  it('POST /complete em consulta já cancelada falha 400', async () => {
    // cria + cancela + tenta complete
    const newAppt = await request(http)
      .post(`/api/babies/${babyId}/appointments`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ title: 'Para cancelar', scheduledAt: isoFromNow(5) })
      .expect(201);

    await request(http)
      .post(`/api/babies/${babyId}/appointments/${newAppt.body.id}/cancel`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ reason: 'remarcada' })
      .expect(200);

    await request(http)
      .post(`/api/babies/${babyId}/appointments/${newAppt.body.id}/complete`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({})
      .expect(400);
  });

  // ----------------------------------------------------------------
  // Update + Delete
  // ----------------------------------------------------------------
  it('PATCH atualiza campos editáveis sem mudar status', async () => {
    const list = await request(http)
      .get(`/api/babies/${babyId}/appointments?scope=past`)
      .set('Authorization', `Bearer ${mguibToken}`);
    const id = list.body[0].id;

    const res = await request(http)
      .patch(`/api/babies/${babyId}/appointments/${id}`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ doctorName: 'Dr. Atualizado', specialty: 'Cardiopediatra' })
      .expect(200);

    expect(res.body.doctorName).toBe('Dr. Atualizado');
    expect(res.body.specialty).toBe('Cardiopediatra');
  });

  it('DELETE soft-deleta consulta — some das listas', async () => {
    const created = await request(http)
      .post(`/api/babies/${babyId}/appointments`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ title: 'Pra deletar', scheduledAt: isoFromNow(10) })
      .expect(201);

    await request(http)
      .delete(`/api/babies/${babyId}/appointments/${created.body.id}`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(204);

    const list = await request(http)
      .get(`/api/babies/${babyId}/appointments`)
      .set('Authorization', `Bearer ${mguibToken}`);
    expect(list.body.find((a: any) => a.id === created.body.id)).toBeUndefined();
  });

  // ----------------------------------------------------------------
  // Isolation
  // ----------------------------------------------------------------
  it('Intruso (outra família) não enxerga nem cria pra bebê alheio', async () => {
    await request(http)
      .get(`/api/babies/${babyId}/appointments`)
      .set('Authorization', `Bearer ${intrusoToken}`)
      .expect(403);

    await request(http)
      .post(`/api/babies/${babyId}/appointments`)
      .set('Authorization', `Bearer ${intrusoToken}`)
      .send({ title: 'Invasor', scheduledAt: isoFromNow(3) })
      .expect(403);

    // O intruso consegue criar para o próprio bebê
    await request(http)
      .post(`/api/babies/${intrusoBabyId}/appointments`)
      .set('Authorization', `Bearer ${intrusoToken}`)
      .send({ title: 'Minha consulta', scheduledAt: isoFromNow(3) })
      .expect(201);
  });
});
