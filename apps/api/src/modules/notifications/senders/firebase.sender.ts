import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PushPayload } from '../interfaces/push-payload.interface';
import { PushSender, PushSendResult } from './push-sender';

// Implementação real do PushSender usando Firebase Admin SDK.
// Inicializa o app Firebase no boot do módulo lendo as 3 vars do .env.
// Se algum erro acontecer no init (credencial inválida, etc.), o boot
// falha cedo — push é feature crítica do produto e não deve subir quebrada.
@Injectable()
export class FirebaseSender implements PushSender, OnModuleInit {
  private readonly logger = new Logger(FirebaseSender.name);
  private app!: admin.app.App;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const projectId = this.config.getOrThrow<string>('FIREBASE_PROJECT_ID');
    const clientEmail = this.config.getOrThrow<string>('FIREBASE_CLIENT_EMAIL');
    const rawPrivateKey = this.config.getOrThrow<string>('FIREBASE_PRIVATE_KEY');

    // No .env a chave vem com \n literais (não quebras de linha reais).
    // O firebase-admin precisa das quebras de linha. Converte aqui.
    const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

    // Evita inicializar duas vezes em testes/hot-reload (firebase-admin é singleton).
    if (admin.apps.length > 0) {
      this.app = admin.apps[0]!;
    } else {
      this.app = admin.initializeApp({
        credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
      });
    }

    this.logger.log(`Firebase Admin inicializado para projeto: ${projectId}`);
  }

  async sendToTokens(tokens: string[], payload: PushPayload): Promise<PushSendResult[]> {
    if (tokens.length === 0) return [];

    const messaging = admin.messaging(this.app);

    // sendEachForMulticast: envia o mesmo payload pra N tokens, devolve
    // um BatchResponse com results[] na mesma ordem.
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
    });

    return response.responses.map((res, idx) => {
      const token = tokens[idx];
      if (res.success) {
        return { token, success: true };
      }

      // Códigos do FCM que significam "esquece esse token, ele é inútil".
      // Lista em: https://firebase.google.com/docs/cloud-messaging/send-message#admin
      const code = res.error?.code ?? '';
      const isInvalid =
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token' ||
        code === 'messaging/invalid-argument';

      const isRateLimit =
        code === 'messaging/quota-exceeded' || code === 'messaging/server-unavailable';

      return {
        token,
        success: false,
        errorCode: isInvalid ? 'invalid-token' : isRateLimit ? 'rate-limited' : 'unknown',
        errorMessage: res.error?.message,
      };
    });
  }
}
