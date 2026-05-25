import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentsService } from '../appointments.service';

// Roda diariamente às 4h da manhã (Manaus) e marca como MISSED as consultas
// que estavam SCHEDULED e cujo scheduledAt já passou de 24h sem atualização.
// O usuário pode "reabrir" editando a consulta se foi engano.
@Injectable()
export class AppointmentsMissedJob {
  private readonly logger = new Logger(AppointmentsMissedJob.name);

  constructor(private readonly appointments: AppointmentsService) {}

  @Cron(CronExpression.EVERY_DAY_AT_4AM, {
    name: 'appointments-mark-missed',
    timeZone: 'America/Manaus',
  })
  async markMissed(): Promise<void> {
    const count = await this.appointments.markPastDueAsMissed(24);
    if (count > 0) {
      this.logger.log(`Consultas marcadas como MISSED: ${count}`);
    }
  }
}
