// Testa o FirebaseSender com o firebase-admin mockado: a conversão da
// private key e, principalmente, o mapeamento dos códigos de erro do FCM
// pros errorCodes internos — é ele que decide se o token é limpo do banco.
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { FirebaseSender } from './firebase.sender';

const sendEachForMulticast = jest.fn();

jest.mock('firebase-admin', () => ({
  apps: [] as unknown[],
  credential: { cert: jest.fn(() => ({ kind: 'mock-credential' })) },
  initializeApp: jest.fn(() => ({ name: 'mock-app' })),
  messaging: jest.fn(() => ({ sendEachForMulticast })),
}));

const ENV: Record<string, string> = {
  FIREBASE_PROJECT_ID: 'bebecare-test',
  FIREBASE_CLIENT_EMAIL: 'svc@bebecare-test.iam.gserviceaccount.com',
  // \n literais, como vêm do .env — o sender precisa converter pra quebra real
  FIREBASE_PRIVATE_KEY: '-----BEGIN KEY-----\\nabc\\n-----END KEY-----',
};

function buildSender(): FirebaseSender {
  const config = {
    getOrThrow: jest.fn((key: string) => {
      if (ENV[key] === undefined) throw new Error(`Missing ${key}`);
      return ENV[key];
    }),
  } as unknown as ConfigService;
  return new FirebaseSender(config);
}

// Helper: resposta do FCM com um item por token, na ordem
function fcmResponse(responses: Array<{ success: boolean; code?: string }>) {
  return {
    responses: responses.map((r) => ({
      success: r.success,
      error: r.success ? undefined : { code: r.code, message: `erro ${r.code}` },
    })),
  };
}

describe('FirebaseSender', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (admin.apps as unknown[]).length = 0; // reseta o singleton simulado
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('onModuleInit', () => {
    it('converte os \\n literais da private key em quebras de linha reais', () => {
      const sender = buildSender();
      sender.onModuleInit();

      expect(admin.credential.cert).toHaveBeenCalledWith({
        projectId: 'bebecare-test',
        clientEmail: 'svc@bebecare-test.iam.gserviceaccount.com',
        privateKey: '-----BEGIN KEY-----\nabc\n-----END KEY-----',
      });
      expect(admin.initializeApp).toHaveBeenCalledTimes(1);
    });

    it('reaproveita o app existente (firebase-admin é singleton, hot-reload/testes)', () => {
      (admin.apps as unknown[]).push({ name: 'ja-existente' });

      const sender = buildSender();
      sender.onModuleInit();

      expect(admin.initializeApp).not.toHaveBeenCalled();
    });
  });

  describe('sendToTokens', () => {
    let sender: FirebaseSender;

    beforeEach(() => {
      sender = buildSender();
      sender.onModuleInit();
    });

    it('lista vazia: retorna [] sem chamar o FCM', async () => {
      await expect(sender.sendToTokens([], { title: 'x', body: 'y' })).resolves.toEqual([]);
      expect(sendEachForMulticast).not.toHaveBeenCalled();
    });

    it('mapeia códigos de "token morto" do FCM para invalid-token (aciona limpeza no DB)', async () => {
      sendEachForMulticast.mockResolvedValue(
        fcmResponse([
          { success: false, code: 'messaging/registration-token-not-registered' },
          { success: false, code: 'messaging/invalid-registration-token' },
          { success: false, code: 'messaging/invalid-argument' },
        ]),
      );

      const results = await sender.sendToTokens(['t1', 't2', 't3'], { title: 'x', body: 'y' });

      expect(results.map((r) => r.errorCode)).toEqual([
        'invalid-token',
        'invalid-token',
        'invalid-token',
      ]);
    });

    it('mapeia quota/indisponibilidade para rate-limited (transiente, não limpa token)', async () => {
      sendEachForMulticast.mockResolvedValue(
        fcmResponse([
          { success: false, code: 'messaging/quota-exceeded' },
          { success: false, code: 'messaging/server-unavailable' },
        ]),
      );

      const results = await sender.sendToTokens(['t1', 't2'], { title: 'x', body: 'y' });

      expect(results.map((r) => r.errorCode)).toEqual(['rate-limited', 'rate-limited']);
    });

    it('código desconhecido vira unknown e preserva a mensagem original', async () => {
      sendEachForMulticast.mockResolvedValue(
        fcmResponse([{ success: false, code: 'messaging/internal-error' }]),
      );

      const [result] = await sender.sendToTokens(['t1'], { title: 'x', body: 'y' });

      expect(result).toEqual({
        token: 't1',
        success: false,
        errorCode: 'unknown',
        errorMessage: 'erro messaging/internal-error',
      });
    });

    it('mistura sucesso/falha: um resultado por token, na MESMA ordem da entrada', async () => {
      sendEachForMulticast.mockResolvedValue(
        fcmResponse([
          { success: true },
          { success: false, code: 'messaging/registration-token-not-registered' },
          { success: true },
        ]),
      );

      const results = await sender.sendToTokens(['a', 'b', 'c'], {
        title: 'Lembrete',
        body: 'corpo',
        data: { type: 'appointment', id: 'appt-1' },
      });

      expect(results).toEqual([
        { token: 'a', success: true },
        expect.objectContaining({ token: 'b', success: false, errorCode: 'invalid-token' }),
        { token: 'c', success: true },
      ]);
      // Payload repassado no formato do FCM
      expect(sendEachForMulticast).toHaveBeenCalledWith({
        tokens: ['a', 'b', 'c'],
        notification: { title: 'Lembrete', body: 'corpo' },
        data: { type: 'appointment', id: 'appt-1' },
      });
    });
  });
});
