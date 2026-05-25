import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

// REQUER Postgres + migrations + seed do PNI aplicado.
describe('Vaccines / PNI (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  const stamp = Date.now();
  const mguibEmail = `vac-mguib-${stamp}@example.com`;
  const intrusoEmail = `vac-intruso-${stamp}@example.com`;
  const password = 'senhaSegura123';

  let mguibToken: string;
  let intrusoToken: string;
  let mguibFamilyId: string;

  // Bebês com idades distintas pra exercitar todos os status
  let newbornId: string; // 0 meses
  let nineMonthsId: string; // 9 meses (cenário do Mguib)
  let toddlerId: string; // 24 meses (vai ter overdue)

  // Vacinas conhecidas (por code) pra usar nos asserts
  let bcgVaccineId: string;
  let penta1Id: string;

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

    // ---- Setup: cria 2 users, 3 bebês ----
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

    const now = new Date();
    const isoFromMonthsAgo = (m: number): string => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - m, now.getUTCDate()));
      return d.toISOString().slice(0, 10);
    };

    const nb = await request(http)
      .post('/api/babies')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ name: 'Recém-nascido', sex: 'male', birthDate: isoFromMonthsAgo(0) })
      .expect(201);
    newbornId = nb.body.id;

    const nine = await request(http)
      .post('/api/babies')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ name: 'Theo 9m', sex: 'male', birthDate: isoFromMonthsAgo(9) })
      .expect(201);
    nineMonthsId = nine.body.id;

    const tod = await request(http)
      .post('/api/babies')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ name: 'Toddler', sex: 'female', birthDate: isoFromMonthsAgo(24) })
      .expect(201);
    toddlerId = tod.body.id;
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
        await ds.query(`DELETE FROM vaccine_records WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM babies WHERE family_id = ANY($1::uuid[])`, [ids]);
        await ds.query(`DELETE FROM families WHERE id = ANY($1::uuid[])`, [ids]);
      }
      await app.close();
    }
  });

  // -----------------------------------------------------------------
  // Catálogo
  // -----------------------------------------------------------------
  it('GET /vaccines/catalog retorna o catálogo PNI populado', async () => {
    const res = await request(http)
      .get('/api/vaccines/catalog')
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(25);

    // Confere algumas vacinas-chave
    const bcg = res.body.find((v: any) => v.code === 'BCG');
    expect(bcg).toBeDefined();
    expect(bcg.recommendedAgeMonths).toBe(0);
    bcgVaccineId = bcg.id;

    const penta1 = res.body.find((v: any) => v.code === 'PENTA_1');
    expect(penta1).toBeDefined();
    expect(penta1.recommendedAgeMonths).toBe(2);
    penta1Id = penta1.id;
  });

  // -----------------------------------------------------------------
  // Schedule
  // -----------------------------------------------------------------
  it('Schedule do recém-nascido — BCG fica DUE, doses futuras UPCOMING', async () => {
    const res = await request(http)
      .get(`/api/babies/${newbornId}/vaccine-schedule`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    expect(res.body.babyAgeMonths).toBe(0);

    const bcg = res.body.entries.find((e: any) => e.vaccine.code === 'BCG');
    expect(bcg.status).toBe('due');

    const penta1 = res.body.entries.find((e: any) => e.vaccine.code === 'PENTA_1');
    expect(penta1.status).toBe('upcoming');

    expect(res.body.summary.due).toBeGreaterThan(0);
    expect(res.body.summary.upcoming).toBeGreaterThan(0);
    expect(res.body.summary.overdue).toBe(0);
  });

  it('Schedule do bebê de 9m — vacinas dos 2-6m sem registro ficam OVERDUE', async () => {
    const res = await request(http)
      .get(`/api/babies/${nineMonthsId}/vaccine-schedule`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    expect(res.body.babyAgeMonths).toBeGreaterThanOrEqual(9);

    // PENTA_1 (2m) tem tolerância 6m → após 8m fica OVERDUE
    const penta1 = res.body.entries.find((e: any) => e.vaccine.code === 'PENTA_1');
    expect(penta1.status).toBe('overdue');

    // Febre amarela (9m) fica DUE
    const yf = res.body.entries.find((e: any) => e.vaccine.code === 'YF_1');
    expect(yf.status).toBe('due');

    // Tríplice viral (12m) ainda UPCOMING
    const mmr = res.body.entries.find((e: any) => e.vaccine.code === 'MMR_1');
    expect(mmr.status).toBe('upcoming');
  });

  // -----------------------------------------------------------------
  // CRUD de records + impacto no schedule
  // -----------------------------------------------------------------
  it('POST cria record da BCG → schedule passa de DUE para APPLIED', async () => {
    await request(http)
      .post(`/api/babies/${newbornId}/vaccine-records`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        vaccineId: bcgVaccineId,
        appliedAt: new Date().toISOString().slice(0, 10),
        lotNumber: 'ABC123',
        location: 'Maternidade',
      })
      .expect(201);

    const res = await request(http)
      .get(`/api/babies/${newbornId}/vaccine-schedule`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    const bcg = res.body.entries.find((e: any) => e.vaccine.code === 'BCG');
    expect(bcg.status).toBe('applied');
    expect(bcg.appliedAt).toBeDefined();
    expect(bcg.recordId).toBeDefined();
  });

  it('POST duplicado da mesma vacina retorna 409', async () => {
    await request(http)
      .post(`/api/babies/${newbornId}/vaccine-records`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({
        vaccineId: bcgVaccineId,
        appliedAt: new Date().toISOString().slice(0, 10),
      })
      .expect(409);
  });

  it('GET histórico do bebê retorna os records', async () => {
    const res = await request(http)
      .get(`/api/babies/${newbornId}/vaccine-records`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].vaccine.code).toBe('BCG');
    expect(res.body[0].lotNumber).toBe('ABC123');
  });

  it('Intruso (outra família) não pode ver schedule nem registrar para bebê de outro', async () => {
    await request(http)
      .get(`/api/babies/${newbornId}/vaccine-schedule`)
      .set('Authorization', `Bearer ${intrusoToken}`)
      .expect(404);

    await request(http)
      .post(`/api/babies/${newbornId}/vaccine-records`)
      .set('Authorization', `Bearer ${intrusoToken}`)
      .send({
        vaccineId: penta1Id,
        appliedAt: new Date().toISOString().slice(0, 10),
      })
      .expect(403);
  });

  it('PATCH corrige a data de aplicação', async () => {
    const records = await request(http)
      .get(`/api/babies/${newbornId}/vaccine-records`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    const recordId = records.body[0].id;

    const res = await request(http)
      .patch(`/api/babies/${newbornId}/vaccine-records/${recordId}`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ lotNumber: 'XYZ999', location: 'UBS Centro' })
      .expect(200);

    expect(res.body.lotNumber).toBe('XYZ999');
    expect(res.body.location).toBe('UBS Centro');
  });

  it('DELETE remove o record → schedule volta a DUE', async () => {
    const records = await request(http)
      .get(`/api/babies/${newbornId}/vaccine-records`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    const recordId = records.body[0].id;

    await request(http)
      .delete(`/api/babies/${newbornId}/vaccine-records/${recordId}`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(204);

    const res = await request(http)
      .get(`/api/babies/${newbornId}/vaccine-schedule`)
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    const bcg = res.body.entries.find((e: any) => e.vaccine.code === 'BCG');
    expect(bcg.status).toBe('due');
  });
});
