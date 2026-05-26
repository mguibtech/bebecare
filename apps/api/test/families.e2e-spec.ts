import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

// Fluxo completo de família + convites + leave + delete account.
// REQUER Postgres rodando + migrations aplicadas.
describe('Families flow (e2e)', () => {
  let app: INestApplication<App>;
  let http: App;

  const stamp = Date.now();
  const mguibEmail = `mguib-${stamp}@example.com`;
  const partnerEmail = `partner-${stamp}@example.com`;
  const password = 'senhaSegura123';

  let mguibToken: string;
  let partnerToken: string;
  let inviteCode: string;
  let _inviteId: string;
  let mguibFamilyId: string;

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
    if (app) {
      const ds = app.get(DataSource);
      // Limpa em ordem para respeitar FKs (refresh_tokens -> users -> families)
      await ds.query(
        `DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN ($1, $2))`,
        [mguibEmail, partnerEmail],
      );
      await ds.query(
        `DELETE FROM family_invites WHERE created_by_user_id IN (SELECT id FROM users WHERE email IN ($1, $2))`,
        [mguibEmail, partnerEmail],
      );
      const familyIds = await ds.query(`SELECT family_id FROM users WHERE email IN ($1, $2)`, [
        mguibEmail,
        partnerEmail,
      ]);
      await ds.query(`DELETE FROM users WHERE email IN ($1, $2)`, [mguibEmail, partnerEmail]);
      if (familyIds.length > 0) {
        const ids = familyIds.map((r: any) => r.family_id);
        await ds.query(`DELETE FROM families WHERE id = ANY($1::uuid[])`, [ids]);
      }
      await app.close();
    }
  });

  it('Mguib se registra solo', async () => {
    const res = await request(http)
      .post('/api/auth/register')
      .send({ email: mguibEmail, name: 'Mguib', password })
      .expect(201);
    mguibToken = res.body.accessToken;
    mguibFamilyId = res.body.user.familyId;
  });

  it('GET /families/me retorna 1 membro (o próprio Mguib) e sem convites', async () => {
    const res = await request(http)
      .get('/api/families/me')
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    expect(res.body.id).toBe(mguibFamilyId);
    expect(res.body.members).toHaveLength(1);
    expect(res.body.members[0].isMe).toBe(true);
    expect(res.body.pendingInvites).toHaveLength(0);
    expect(res.body.maxMembers).toBe(4);
  });

  it('PATCH /families/me renomeia a família', async () => {
    const res = await request(http)
      .patch('/api/families/me')
      .set('Authorization', `Bearer ${mguibToken}`)
      .send({ name: 'Família Teste' })
      .expect(200);

    expect(res.body.name).toBe('Família Teste');
  });

  it('POST /families/me/invites gera código de 6 dígitos', async () => {
    const res = await request(http)
      .post('/api/families/me/invites')
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(201);

    expect(res.body.code).toMatch(/^\d{6}$/);
    expect(res.body.status).toBe('pending');
    expect(res.body.createdByName).toBe('Mguib');
    expect(new Date(res.body.expiresAt).getTime()).toBeGreaterThan(Date.now());

    inviteCode = res.body.code;
    _inviteId = res.body.id;
  });

  it('Convite aparece em GET /families/me/invites', async () => {
    const res = await request(http)
      .get('/api/families/me/invites')
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].code).toBe(inviteCode);
  });

  it('Partner se registra USANDO o código e entra na mesma família', async () => {
    const res = await request(http)
      .post('/api/auth/register')
      .send({
        email: partnerEmail,
        name: 'Partner',
        password,
        inviteCode,
      })
      .expect(201);

    expect(res.body.user.familyId).toBe(mguibFamilyId);
    partnerToken = res.body.accessToken;
  });

  it('GET /families/me agora mostra 2 membros nos dois lados', async () => {
    const mguibRes = await request(http)
      .get('/api/families/me')
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(200);
    expect(mguibRes.body.members).toHaveLength(2);

    const partnerRes = await request(http)
      .get('/api/families/me')
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(200);
    expect(partnerRes.body.members).toHaveLength(2);
    expect(partnerRes.body.members.find((m: any) => m.isMe).name).toBe('Partner');
  });

  it('Reuso do mesmo inviteCode falha (já foi aceito)', async () => {
    await request(http)
      .post('/api/auth/register')
      .send({
        email: `outro-${stamp}@example.com`,
        name: 'Outro',
        password,
        inviteCode,
      })
      .expect(400);
  });

  it('Partner pode revogar convite criado pelo Mguib (qualquer membro pode)', async () => {
    // Mas como o convite já foi aceito (acima), tentar revogar dá 400.
    // Cria um novo pelo Mguib e revoga pelo Partner.
    const newInvite = await request(http)
      .post('/api/families/me/invites')
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(201);

    await request(http)
      .delete(`/api/families/me/invites/${newInvite.body.id}`)
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(204);
  });

  it('Partner sai da família → vai para uma nova solo', async () => {
    await request(http)
      .post('/api/families/me/leave')
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(204);

    // /me do partner agora aponta para outra família
    const res = await request(http)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(200);

    expect(res.body.user.familyId).not.toBe(mguibFamilyId);
    expect(res.body.family.members).toHaveLength(0); // solo de novo
  });

  it('Mguib (agora solo) tentando sair da família falha com 400', async () => {
    await request(http)
      .post('/api/families/me/leave')
      .set('Authorization', `Bearer ${mguibToken}`)
      .expect(400);
  });

  it('DELETE /users/me exclui a conta do Partner (solo) — soft-delete em cadeia', async () => {
    await request(http)
      .delete('/api/users/me')
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(204);

    // Sessões revogadas — qualquer request com o token antigo retorna 401
    await request(http)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${partnerToken}`)
      .expect(401);
  });
});
