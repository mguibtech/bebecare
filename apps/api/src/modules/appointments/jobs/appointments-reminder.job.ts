import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { NotificationsService } from '../../notifications/notifications.service';
import { Appointment } from '../entities/appointment.entity';

// Roda a cada 5 minutos. Busca consultas SCHEDULED cujo lembrete entrou na janela
// (scheduledAt - reminderMinutesBefore já passou) e que ainda não foram notificadas.
// Para cada uma, envia push para todos os membros da família e marca notified_at.
//
// Granularidade de 5min é suficiente para consultas (default 24h antes,
// usuário não precisa de precisão fina). Reduz carga vs. cron de 1min.
@Injectable()
export class AppointmentsReminderJob {
  private readonly logger = new Logger(AppointmentsReminderJob.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    private readonly notifications: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'appointments-send-reminders',
    timeZone: 'America/Manaus',
  })
  async sendReminders(): Promise<void> {
    const count = await this.runOnce();
    if (count > 0) {
      this.logger.log(`Lembretes de consulta enviados: ${count}`);
    }
  }

  // -------------------------------------------------------------------
  // Lógica extraída para um método público — os testes e2e chamam direto,
  // sem precisar esperar o cron (mesmo padrão do CreateDailyDoseLogsJob/A7).
  // -------------------------------------------------------------------
  async runOnce(): Promise<number> {
    // Busca consultas em que a janela do lembrete já abriu (scheduledAt -
    // reminderMinutesBefore <= now) E que ainda estão no futuro (scheduledAt > now),
    // ainda não notificadas. O índice parcial criado na migration cobre a varredura.
    const due = await this.appointments
      .createQueryBuilder('a')
      .where('a.notified_at IS NULL')
      .andWhere('a.status = :status', { status: AppointmentStatus.SCHEDULED })
      .andWhere('a.reminder_enabled = true')
      .andWhere('a.deleted_at IS NULL')
      .andWhere('a.scheduled_at > NOW()')
      .andWhere(`a.scheduled_at - (a.reminder_minutes_before * INTERVAL '1 minute') <= NOW()`)
      .getMany();

    let sent = 0;
    for (const appt of due) {
      try {
        await this.notifications.sendToFamily(appt.familyId, {
          title: `Lembrete: ${appt.title}`,
          body: this.buildBody(appt),
          data: { type: 'appointment', id: appt.id },
        });

        // Marca como notificado mesmo se sendToFamily não enviou (família sem fcm_token).
        // Sem isso, cron retornaria nessa consulta a cada 5min eternamente.
        appt.notifiedAt = new Date();
        await this.appointments.save(appt);
        sent += 1;
      } catch (err) {
        // Falhou o envio (ex.: Firebase fora do ar). Não marca notified_at —
        // próxima rodada tenta de novo.
        this.logger.error(
          `Falha ao enviar lembrete da consulta ${appt.id}: ${(err as Error).message}`,
        );
      }
    }
    return sent;
  }

  // -------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------
  private buildBody(appt: Appointment): string {
    const when = appt.scheduledAt.toLocaleString('pt-BR', {
      timeZone: 'America/Manaus',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    const where = appt.location ? ` em ${appt.location}` : '';
    const doctor = appt.doctorName ? ` com ${appt.doctorName}` : '';
    return `${when}${doctor}${where}`;
  }
}
