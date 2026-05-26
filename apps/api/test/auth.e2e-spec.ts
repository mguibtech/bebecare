import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

// Fluxo completo de autenticação. REQUER o Postgres em execução
// (`npm run db:up` + `npm run migration:run` na raiz).
describe('Auth flow (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  // Email aleatório por execução para não colidir entre rodadas no mesmo banco.
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'senhaSegura123';
  const name = 'E2E User';

  let accessToken: string;
  let refreshToken: string;

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
  });

  afterAll(async () => {
    // Limpa o user criado no teste para manter o banco enxuto
    if (app) {
      const dataSource = app.get(DataSource);
      await dataSource.query(`DELETE FROM users WHERE email = $1`, [email]);
      await app.close();
    }
  });

  it('POST /api/auth/register cria user solo e devolve tokens', async () => {
    const res = await request(http)
      .post('/api/auth/register')
      .send({ email, name, password })
      .expect(201);

    expect(res.body.user.email).toBe(email);
    expect(res.body.user.familyId).toBeDefined();
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.expiresIn).toBeGreaterThan(0);

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('POST /api/auth/register rejeita email duplicado com 409', async () => {
    await request(http).post('/api/auth/register').send({ email, name, password }).expect(409);
  });

  it('POST /api/auth/login com senha errada retorna 401', async () => {
    await request(http).post('/api/auth/login').send({ email, password: 'errada' }).expect(401);
  });

  it('POST /api/auth/login com credenciais corretas retorna tokens', async () => {
    const res = await request(http).post('/api/auth/login').send({ email, password }).expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('GET /api/auth/me sem token retorna 401', async () => {
    await request(http).get('/api/auth/me').expect(401);
  });

  it('GET /api/auth/me com token retorna user + family (sem outros membros)', async () => {
    const res = await request(http)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.user.email).toBe(email);
    expect(res.body.family.id).toBeDefined();
    expect(res.body.family.members).toEqual([]);
  });

  it('POST /api/auth/refresh rotaciona refresh e devolve novo par', async () => {
    const oldRefresh = refreshToken;

    const res = await request(http)
      .post('/api/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .expect(200);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.refreshToken).not.toBe(oldRefresh);

    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('Reuso de refresh já rotacionado retorna 401 (detecção de comprometimento)', async () => {
    const first = await request(http).post('/api/auth/refresh').send({ refreshToken }).expect(200);

    const consumed = refreshToken;
    refreshToken = first.body.refreshToken;
    accessToken = first.body.accessToken;

    // Agora usa o `consumed` (já revogado) — deve dar 401
    await request(http).post('/api/auth/refresh').send({ refreshToken: consumed }).expect(401);

    // E como detectamos comprometimento, todos os refresh do user foram revogados —
    // o `refreshToken` atual também deveria ter sido revogado em cadeia.
    await request(http).post('/api/auth/refresh').send({ refreshToken }).expect(401);
  });

  it('Após logout-all, é preciso fazer login de novo', async () => {
    // login fresco
    const fresh = await request(http).post('/api/auth/login').send({ email, password }).expect(200);

    const tk = fresh.body.accessToken;
    const rt = fresh.body.refreshToken;

    // logout-all (revoga TODOS os refresh do user)
    await request(http)
      .post('/api/auth/logout-all')
      .set('Authorization', `Bearer ${tk}`)
      .expect(204);

    // refresh atual já está revogado
    await request(http).post('/api/auth/refresh').send({ refreshToken: rt }).expect(401);
  });
});
