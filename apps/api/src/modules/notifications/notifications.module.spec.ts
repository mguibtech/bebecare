// Testa a factory do PUSH_SENDER declarada no NotificationsModule:
// a escolha entre FirebaseSender (push real) e StubSender ("push desabilitado",
// só loga) conforme NODE_ENV e presença das 3 vars FIREBASE_*.
//
// A factory é extraída dos metadados do módulo via Reflect — evita compilar
// TypeORM/Config de verdade só pra testar a decisão de wiring.
import 'reflect-metadata';
import { FactoryProvider, Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { NotificationsModule } from './notifications.module';
import { FirebaseSender } from './senders/firebase.sender';
import { PUSH_SENDER } from './senders/push-sender';
import type { PushSender } from './senders/push-sender';
import { StubSender } from './senders/stub.sender';

jest.mock('firebase-admin', () => ({
  apps: [],
  credential: { cert: jest.fn(() => ({ kind: 'mock-credential' })) },
  initializeApp: jest.fn(() => ({ name: 'mock-app' })),
  messaging: jest.fn(),
}));

// Vars completas de Firebase pra montar os cenários
const FIREBASE_ENV = {
  FIREBASE_PROJECT_ID: 'bebecare-test',
  FIREBASE_CLIENT_EMAIL: 'svc@bebecare-test.iam.gserviceaccount.com',
  FIREBASE_PRIVATE_KEY: '-----BEGIN KEY-----\\nabc\\n-----END KEY-----',
};

function buildConfig(env: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string) => env[key]),
    getOrThrow: jest.fn((key: string) => {
      const value = env[key];
      if (value === undefined) throw new Error(`Missing ${key}`);
      return value;
    }),
  } as unknown as ConfigService;
}

function resolveSender(env: Record<string, string | undefined>): PushSender {
  const providers = Reflect.getMetadata('providers', NotificationsModule) as Provider[];
  const factoryProvider = providers.find(
    (p): p is FactoryProvider =>
      typeof p === 'object' && 'provide' in p && p.provide === PUSH_SENDER,
  );
  if (!factoryProvider) throw new Error('PUSH_SENDER factory não encontrada no módulo');
  return factoryProvider.useFactory(buildConfig(env)) as PushSender;
}

describe('NotificationsModule — factory do PUSH_SENDER', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('NODE_ENV=test usa SEMPRE o stub, mesmo com Firebase configurado', () => {
    const sender = resolveSender({ NODE_ENV: 'test', ...FIREBASE_ENV });

    expect(sender).toBeInstanceOf(StubSender);
    expect(admin.initializeApp).not.toHaveBeenCalled();
  });

  it('sem nenhuma var FIREBASE_*: modo "push desabilitado" — stub + aviso no log', () => {
    const sender = resolveSender({ NODE_ENV: 'production' });

    expect(sender).toBeInstanceOf(StubSender);
    expect(Logger.prototype.warn).toHaveBeenCalledWith(
      expect.stringContaining('FIREBASE_* não configurado'),
    );
  });

  it('config parcial (falta FIREBASE_PRIVATE_KEY) também cai no stub', () => {
    const sender = resolveSender({
      NODE_ENV: 'production',
      FIREBASE_PROJECT_ID: FIREBASE_ENV.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: FIREBASE_ENV.FIREBASE_CLIENT_EMAIL,
    });

    expect(sender).toBeInstanceOf(StubSender);
  });

  it('3 vars presentes fora de teste: FirebaseSender real, já inicializado', () => {
    const sender = resolveSender({ NODE_ENV: 'production', ...FIREBASE_ENV });

    expect(sender).toBeInstanceOf(FirebaseSender);
    // A factory chama onModuleInit manualmente — o app Firebase precisa existir
    expect(admin.initializeApp).toHaveBeenCalledTimes(1);
    expect(admin.credential.cert).toHaveBeenCalledWith(
      expect.objectContaining({ projectId: 'bebecare-test' }),
    );
  });

  it('stub registra os envios em memória e responde sucesso pra todos os tokens', async () => {
    const sender = resolveSender({ NODE_ENV: 'production' }) as StubSender;

    const results = await sender.sendToTokens(['t1', 't2'], {
      title: 'Oi',
      body: 'corpo',
    });

    expect(results).toEqual([
      { token: 't1', success: true },
      { token: 't2', success: true },
    ]);
    expect(sender.sent).toHaveLength(1);
    expect(sender.sent[0].tokens).toEqual(['t1', 't2']);

    // reset() limpa o histórico entre specs
    sender.reset();
    expect(sender.sent).toHaveLength(0);
  });
});
