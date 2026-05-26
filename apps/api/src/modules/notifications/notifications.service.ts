import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { PushPayload } from './interfaces/push-payload.interface';
import { PUSH_SENDER } from './senders/push-sender';
import type { PushSender } from './senders/push-sender';

// Serviço de alto nível usado pelas crons de lembrete.
// Responsabilidades:
//  - Resolver userId/familyId → fcm_tokens.
//  - Delegar o envio ao PushSender (FirebaseSender em prod, StubSender em test/dev).
//  - Limpar fcm_token do banco quando o provedor diz que o token é inválido,
//    evitando reenviar para devices desinstalados.
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @Inject(PUSH_SENDER) private readonly sender: PushSender,
  ) {}

  // Envia push para TODOS os membros de uma família que têm fcm_token registrado.
  // É o caso mais comum no BebeCare: lembrete de consulta/remédio vai pro casal
  // inteiro (ambos veem na tela de bloqueio, quem responde primeiro marca).
  async sendToFamily(familyId: string, payload: PushPayload): Promise<void> {
    const members = await this.users.find({
      where: { familyId, fcmToken: Not(IsNull()) },
      select: ['id', 'fcmToken'],
    });

    const tokens = members
      .map((m) => m.fcmToken)
      .filter((t): t is string => t !== null && t.length > 0);

    if (tokens.length === 0) {
      this.logger.debug(`Família ${familyId} sem fcm_token registrado — pulando push.`);
      return;
    }

    await this.dispatch(tokens, payload);
  }

  // Envia push para UM usuário específico (caso de uso futuro: notificar
  // apenas o cuidador da vez, ex.: turno noturno).
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    const user = await this.users.findOne({
      where: { id: userId, fcmToken: Not(IsNull()) },
      select: ['id', 'fcmToken'],
    });

    if (!user?.fcmToken) {
      this.logger.debug(`User ${userId} sem fcm_token — pulando push.`);
      return;
    }

    await this.dispatch([user.fcmToken], payload);
  }

  // -------------------------------------------------------------------
  // Internos
  // -------------------------------------------------------------------

  private async dispatch(tokens: string[], payload: PushPayload): Promise<void> {
    const results = await this.sender.sendToTokens(tokens, payload);

    // Cleanup: tokens marcados como inválidos pelo provedor são apagados
    // do banco. Cobre casos de uninstall e reset de app.
    const invalidTokens = results
      .filter((r) => !r.success && r.errorCode === 'invalid-token')
      .map((r) => r.token);

    if (invalidTokens.length > 0) {
      await this.users.update({ fcmToken: In(invalidTokens) }, { fcmToken: null });
      this.logger.log(`Limpou ${invalidTokens.length} fcm_token inválido(s) do DB.`);
    }

    // Outros erros (rate-limit, server-unavailable) — só loga, cron tenta de novo.
    const otherErrors = results.filter((r) => !r.success && r.errorCode !== 'invalid-token');
    if (otherErrors.length > 0) {
      this.logger.warn(
        `Falha em ${otherErrors.length} envio(s) (não-invalid). ` +
          `Códigos: ${otherErrors.map((e) => e.errorCode).join(', ')}`,
      );
    }
  }
}
