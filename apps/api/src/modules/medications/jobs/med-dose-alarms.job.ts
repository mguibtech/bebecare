import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DoseStatus } from '../../../common/enums/dose-status.enum';
import { NotificationsService } from '../../notifications/notifications.service';
import { MedDoseLog } from '../entities/med-dose-log.entity';

// Roda a cada 1 minuto (precisão é crítica — alarme de remédio chegar atrasado
// derrota o propósito). Busca doses PENDING cujo schedule tem useAlarm=true
// e cujo scheduledFor cai na janela [now-1min, now+1min].
//
// Janela de ±1min cobre o caso comum de "cron rodou 30s antes ou depois
// do scheduledFor". Doses TAKEN/SKIPPED ficam de fora — não tem sentido
// alarmar algo já marcado como feito.
@Injectable()
export class MedDoseAlarmsJob {
  private readonly logger = new Logger(MedDoseAlarmsJob.name);

  constructor(
    @InjectRepository(MedDoseLog)
    private readonly doseLogs: Repository<MedDoseLog>,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'med-doses-send-alarms',
    timeZone: 'America/Manaus',
  })
  async sendAlarms(): Promise<void> {
    const count = await this.runOnce();
    if (count > 0) {
      this.logger.log(`Alarmes de dose enviados: ${count}`);
    }
  }

  // Extraído para método público — testes e2e chamam direto (mesmo padrão
  // do CreateDailyDoseLogsJob).
  async runOnce(): Promise<number> {
    // Join com schedule.use_alarm — só doses com alarme ligado disparam push.
    // Dose já marcada como TAKEN/SKIPPED é ignorada (status=PENDING explícito).
    const due = await this.doseLogs
      .createQueryBuilder('log')
      .innerJoinAndSelect('log.schedule', 'schedule')
      .innerJoinAndSelect('log.medication', 'med')
      .where('log.notified_at IS NULL')
      .andWhere('log.status = :status', { status: DoseStatus.PENDING })
      .andWhere('schedule.use_alarm = true')
      .andWhere(
        `log.scheduled_for BETWEEN NOW() - INTERVAL '1 minute' AND NOW() + INTERVAL '1 minute'`,
      )
      .getMany();

    let sent = 0;
    for (const log of due) {
      try {
        await this.notifications.sendToFamily(log.familyId, {
          title: `Hora do remédio: ${log.medication.name}`,
          body: this.buildBody(log),
          data: { type: 'dose', id: log.id, medicationId: log.medicationId },
        });

        log.notifiedAt = new Date();
        await this.doseLogs.save(log);
        sent += 1;
      } catch (err) {
        this.logger.error(`Falha ao enviar alarme da dose ${log.id}: ${(err as Error).message}`);
      }
    }
    return sent;
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------
  private buildBody(log: MedDoseLog): string {
    const med = log.medication;
    // dose vem como string do Postgres (DECIMAL). Remove zeros decimais sobrando.
    const dose = parseFloat(med.dose.toString()).toString();
    const instructions = med.instructions ? ` — ${med.instructions}` : '';
    return `${dose} ${med.doseUnit}${instructions}`;
  }
}
