import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { FamilyInvitesService } from '../family-invites.service';

// Job agendado que marca convites PENDING vencidos como EXPIRED, mantendo
// a tabela consistente (sem isso, convites antigos ficariam "zumbis" no estado
// PENDING mesmo após o prazo).
//
// Roda diariamente às 3h da manhã (horário do servidor). Não há janela de
// concorrência crítica — se rodar 2x por algum motivo, a query é idempotente.
@Injectable()
export class FamilyInvitesCleanupJob {
  private readonly logger = new Logger(FamilyInvitesCleanupJob.name);

  constructor(private readonly invites: FamilyInvitesService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM, {
    name: 'family-invites-expire-pending',
    timeZone: 'America/Manaus',
  })
  async expirePending(): Promise<void> {
    const affected = await this.invites.expirePendingPastDue();
    if (affected > 0) {
      this.logger.log(`Convites expirados: ${affected}`);
    }
  }
}
