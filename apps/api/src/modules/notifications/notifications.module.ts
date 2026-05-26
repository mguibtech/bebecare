import { Logger, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { NotificationsService } from './notifications.service';
import { FirebaseSender } from './senders/firebase.sender';
import { PUSH_SENDER } from './senders/push-sender';
import { StubSender } from './senders/stub.sender';

// Factory do PushSender. Lê as 3 vars do .env e decide:
//  - Todas presentes  → FirebaseSender (push real via FCM)
//  - Alguma faltando  → StubSender (loga em vez de enviar)
//
// Isso permite rodar o backend em dev/CI sem precisar configurar Firebase,
// e mantém os testes e2e simples (sem precisar mockar firebase-admin).
const pushSenderProvider: Provider = {
  provide: PUSH_SENDER,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const logger = new Logger('NotificationsModule');

    // Em teste, SEMPRE usar stub — independente de ter Firebase configurado ou não.
    // Sem isso, qualquer spec que importa AppModule (auth, babies, etc.) tentaria
    // inicializar o FirebaseSender de verdade e quebrar se a chave estiver malformada.
    // A spec notifications.e2e-spec.ts ainda faz overrideProvider para acessar a
    // instância e fazer asserts em stub.sent.
    const isTest = config.get<string>('NODE_ENV') === 'test';

    const hasFirebase =
      !!config.get<string>('FIREBASE_PROJECT_ID') &&
      !!config.get<string>('FIREBASE_CLIENT_EMAIL') &&
      !!config.get<string>('FIREBASE_PRIVATE_KEY');

    if (isTest) {
      logger.log('Push notifications: NODE_ENV=test, usando StubSender.');
      return new StubSender();
    }

    if (hasFirebase) {
      logger.log('Push notifications: Firebase configurado, usando FCM real.');
      const sender = new FirebaseSender(config);
      // Chama manualmente o init (factory não dispara OnModuleInit no instance criado aqui).
      sender.onModuleInit();
      return sender;
    }

    logger.warn(
      'Push notifications: FIREBASE_* não configurado, usando StubSender (logs apenas). ' +
        'Defina FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY no .env para ativar push real.',
    );
    return new StubSender();
  },
};

@Module({
  imports: [TypeOrmModule.forFeature([User]), ConfigModule],
  providers: [NotificationsService, pushSenderProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}
