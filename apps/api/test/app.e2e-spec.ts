import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

// Teste de smoke: garante que a app sobe e responde no /api/health.
// REQUER o Postgres em execução (`npm run db:up` na raiz) — o AppModule
// inicializa o TypeOrmModule e tenta conectar no bootstrap.
describe('BebeCare API (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  it('/api/health (GET) responde com status', async () => {
    const res = await request(app.getHttpServer()).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      service: 'bebecare-api',
      version: expect.any(String),
      timestamp: expect.any(String),
      db: expect.stringMatching(/^(up|down)$/),
    });
  });

  afterEach(async () => {
    await app.close();
  });
});
