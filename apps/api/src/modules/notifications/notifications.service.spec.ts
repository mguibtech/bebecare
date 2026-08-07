import { Logger } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, IsNull, Not } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { PushPayload } from './interfaces/push-payload.interface';
import { NotificationsService } from './notifications.service';
import { PUSH_SENDER } from './senders/push-sender';
import type { PushSendResult } from './senders/push-sender';

const PAYLOAD: PushPayload = {
  title: 'Lembrete: Puericultura',
  body: '08/08, 14:30',
  data: { type: 'appointment', id: 'appt-1' },
};

function buildMember(id: string, fcmToken: string | null): Partial<User> {
  return { id, fcmToken };
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let usersRepo: { find: jest.Mock; findOne: jest.Mock; update: jest.Mock };
  let sender: { sendToTokens: jest.Mock };

  // Helper: resultado de envio bem-sucedido pra todos os tokens
  const allSuccess = (tokens: string[]): PushSendResult[] =>
    tokens.map((token) => ({ token, success: true }));

  beforeEach(async () => {
    usersRepo = {
      find: jest.fn(async () => []),
      findOne: jest.fn(),
      update: jest.fn(async () => undefined),
    };
    sender = {
      sendToTokens: jest.fn((tokens: string[]) => Promise.resolve(allSuccess(tokens))),
    };

    // Silencia logs do service (debug/log/warn) e permite asserts
    jest.spyOn(Logger.prototype, 'debug').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);

    const module = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: PUSH_SENDER, useValue: sender },
      ],
    }).compile();

    service = module.get(NotificationsService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('sendToFamily', () => {
    it('envia o mesmo payload pra todos os membros com fcm_token', async () => {
      usersRepo.find.mockResolvedValue([
        buildMember('user-1', 'token-pai'),
        buildMember('user-2', 'token-mae'),
      ]);

      await service.sendToFamily('family-1', PAYLOAD);

      // Busca só membros da família com token registrado
      expect(usersRepo.find).toHaveBeenCalledWith({
        where: { familyId: 'family-1', fcmToken: Not(IsNull()) },
        select: ['id', 'fcmToken'],
      });
      expect(sender.sendToTokens).toHaveBeenCalledWith(['token-pai', 'token-mae'], PAYLOAD);
    });

    it('família sem nenhum token: não chama o sender (evita chamada vazia ao FCM)', async () => {
      usersRepo.find.mockResolvedValue([]);

      await service.sendToFamily('family-1', PAYLOAD);

      expect(sender.sendToTokens).not.toHaveBeenCalled();
    });

    it('token string vazia é filtrado como se não existisse', async () => {
      usersRepo.find.mockResolvedValue([buildMember('user-1', '')]);

      await service.sendToFamily('family-1', PAYLOAD);

      expect(sender.sendToTokens).not.toHaveBeenCalled();
    });

    it('limpa do banco os tokens que o provedor marcou como invalid-token', async () => {
      usersRepo.find.mockResolvedValue([
        buildMember('user-1', 'token-valido'),
        buildMember('user-2', 'token-morto'),
      ]);
      sender.sendToTokens.mockResolvedValue([
        { token: 'token-valido', success: true },
        { token: 'token-morto', success: false, errorCode: 'invalid-token' },
      ] satisfies PushSendResult[]);

      await service.sendToFamily('family-1', PAYLOAD);

      // Device desinstalado → fcm_token vira null, não reenvia nunca mais
      expect(usersRepo.update).toHaveBeenCalledWith(
        { fcmToken: In(['token-morto']) },
        { fcmToken: null },
      );
    });

    it('erros transientes (rate-limited/unknown) NÃO limpam token — cron tenta de novo', async () => {
      usersRepo.find.mockResolvedValue([buildMember('user-1', 'token-1')]);
      sender.sendToTokens.mockResolvedValue([
        { token: 'token-1', success: false, errorCode: 'rate-limited' },
      ] satisfies PushSendResult[]);

      await service.sendToFamily('family-1', PAYLOAD);

      expect(usersRepo.update).not.toHaveBeenCalled();
      expect(Logger.prototype.warn).toHaveBeenCalledWith(expect.stringContaining('rate-limited'));
    });
  });

  describe('sendToUser', () => {
    it('envia só pro token do usuário alvo', async () => {
      usersRepo.findOne.mockResolvedValue(buildMember('user-1', 'token-user-1'));

      await service.sendToUser('user-1', PAYLOAD);

      expect(sender.sendToTokens).toHaveBeenCalledWith(['token-user-1'], PAYLOAD);
    });

    it('usuário sem token registrado: pula o envio silenciosamente', async () => {
      usersRepo.findOne.mockResolvedValue(null);

      await service.sendToUser('user-1', PAYLOAD);

      expect(sender.sendToTokens).not.toHaveBeenCalled();
    });
  });
});
