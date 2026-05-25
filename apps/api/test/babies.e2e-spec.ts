import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

// REQUER Postgres rodando + migrations aplicadas.
describe('Babies + User profile (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  const stamp = Date.now();
  const mguibEmail = `babies-mguib-${stamp}@example.com`;
  const intrusoEmail = `babies-intruso-${stamp}@example.com`;
  const password = 'senhaSegura123';

  let mguibToken: string;
  let mguibFamilyId: string;
  let intrusoToken: string;

  let theoId: string;

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

    // Setup: cria Mguib e Intruso (famílias diferentes — usados pra testar isolamento)
    const r1 = await request(http)
      .post('/api/auth/register')
      .send({ email: mguibEmail, name: 'Mguib', password })
      .expect(201);
    mguibToken = r1.body.accessToken;
    mguibFamilyId = r1.body.user.familyId;

    const r2 = await request(http)
      .post('/api/auth/register')
      .send({ email: intrusoEmail, name: 'Intruso', password })
      .expect(201);
    intrusoToken = r2.body.accessToken;
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
        await ds.query(`DELETE FROM babies WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM families WHERE id = ANY($1::uuid[])`, [ids]);
      }
      await app.close();
    }
  });

  // -----------------------------------------------------------------
  // CRUD de bebês
  // -----------------------------------------------------------------
  it('POST /babies cria bebê com campos obrigatórios e defaults', async () => {
    const res = await request(http)
      .post('/api/babies')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        name: 'Theo',
        sex: 'male',
        birthDate: '2025-08-15',
      })
      .expect(201);

    expect(res.body.name).toBe('Theo');
    expect(res.body.familyId).toBe(mguibFamilyId);
    expect(res.body.avatarStyle).toBe('lorelei');
    expect(res.body.avatarSeed).toBe('theo');
    expect(res.body.bloodType).toBeNull();
    expect(res.body.ageDays).toBeGreaterThan(0);
    theoId = res.body.id;
  });

  it('POST /babies aceita todos os campos opcionais', async () => {
    const res = await request(http)
      .post('/api/babies')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        name: 'Maria',
        sex: 'female',
        birthDate: '2023-01-10',
        birthWeightGrams: 3200,
        birthHeightCm: 48.5,
        bloodType: 'O+',
        allergies: 'lactose',
        eyeColor: 'verdes',
        notes: 'Bebê prematura, acompanhamento extra',
        avatarStyle: 'lorelei',
        avatarSeed: 'mary',
      })
      .expect(201);

    expect(res.body.birthWeightGrams).toBe(3200);
    expect(res.body.birthHeightCm).toBe('48.50');
    expect(res.body.bloodType).toBe('O+');
    expect(res.body.allergies).toBe('lactose');
    expect(res.body.eyeColor).toBe('verdes');
    expect(res.body.notes).toContain('prematura');
  });

  it('POST /babies rejeita peso fora da faixa válida', async () => {
    await request(http)
      .post('/api/babies')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        name: 'Inválido',
        sex: 'male',
        birthDate: '2025-01-01',
        birthWeightGrams: 100, // < 300
      })
      .expect(400);
  });

  it('GET /babies lista os bebês da família (e não os da outra)', async () => {
    const mineRes = await request(http)
      .get('/api/babies')
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);
    expect(mineRes.body).toHaveLength(2);

    const intrusoRes = await request(http)
      .get('/api/babies')
      .set('Authorization', `Bearer ${intrusoToken}`)
      .expect(200);
    expect(intrusoRes.body).toHaveLength(0);
  });

  it('GET /babies/:id retorna bebê e calcula idade', async () => {
    const res = await request(http)
      .get(`/api/babies/${theoId}`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    expect(res.body.id).toBe(theoId);
    expect(res.body.ageMonths).toBeGreaterThanOrEqual(0);
    expect(res.body.ageDays).toBeGreaterThan(0);
  });

  it('GET /babies/:id do Intruso (família diferente) retorna 403', async () => {
    await request(http)
      .get(`/api/babies/${theoId}`)
      .set('Authorization', `Bearer ${intrusoToken}`)
      .expect(403);
  });

  it('PATCH /babies/:id atualiza dados parciais', async () => {
    const res = await request(http)
      .patch(`/api/babies/${theoId}`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        bloodType: 'A+',
        allergies: 'amendoim',
        eyeColor: 'castanhos',
      })
      .expect(200);

    expect(res.body.bloodType).toBe('A+');
    expect(res.body.allergies).toBe('amendoim');
    expect(res.body.eyeColor).toBe('castanhos');
    expect(res.body.name).toBe('Theo'); // não tocado
  });

  it('DELETE /babies/:id faz soft-delete (não aparece mais em GET /babies)', async () => {
    await request(http)
      .delete(`/api/babies/${theoId}`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(204);

    const res = await request(http)
      .get('/api/babies')
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);
    expect(res.body.find((b: any) => b.id === theoId)).toBeUndefined();
  });

  // -----------------------------------------------------------------
  // Edição de perfil + FCM
  // -----------------------------------------------------------------
  it('PATCH /users/me atualiza nome e avatar', async () => {
    const res = await request(http)
      .patch('/api/users/me')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        name: 'Mguib Tech',
        avatarStyle: 'micah',
        avatarSeed: 'mguibtech',
      })
      .expect(200);

    expect(res.body.name).toBe('Mguib Tech');
    expect(res.body.avatarStyle).toBe('micah');
    expect(res.body.avatarSeed).toBe('mguibtech');
  });

  it('PUT /users/me/fcm-token registra token do device', async () => {
    await request(http)
      .put('/api/users/me/fcm-token')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ fcmToken: 'fcm-token-de-teste' })
      .expect(204);
  });

  it('PUT /users/me/fcm-token com null limpa o token', async () => {
    await request(http)
      .put('/api/users/me/fcm-token')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ fcmToken: null })
      .expect(204);
  });
});
