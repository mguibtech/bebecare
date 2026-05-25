import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MedDoseLogsService } from '../med-dose-logs.service';

// Roda diariamente à 0h05 (Manaus) — atraso de 5min depois da meia-noite
// pra evitar race com mudança de dia. Cria logs PENDING para todas as doses
// esperadas do novo dia, baseado nos schedules ativos e `daysOfWeekMask`.
@Injectable()
export class CreateDailyDoseLogsJob {
  private readonly logger = new Logger(CreateDailyDoseLogsJob.name);

  constructor(private readonly doseLogs: MedDoseLogsService) {}

  @Cron('0 5 0 * * *', {
    name: 'create-daily-dose-logs',
    timeZone: 'America/Manaus',
  })
  async createTodaysLogs(): Promise<void> {
    const count = await this.doseLogs.createTodayLogs();
    if (count > 0) {
      this.logger.log(`Logs de dose criados para hoje: ${count}`);
    }
  }
}
