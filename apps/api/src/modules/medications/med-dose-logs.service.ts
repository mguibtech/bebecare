import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, Repository } from 'typeorm';
import { DoseStatus } from '../../common/enums/dose-status.enum';
import { isDayInMask } from '../../common/utils/days-of-week.util';
import { Baby } from '../babies/entities/baby.entity';
import { DoseLogFilterDto } from './dto/dose-log-filter.dto';
import { SkipDoseDto } from './dto/skip-dose.dto';
import { MedDoseLog } from './entities/med-dose-log.entity';
import { MedSchedule } from './entities/med-schedule.entity';
import { Medication } from './entities/medication.entity';

@Injectable()
export class MedDoseLogsService {
  private readonly logger = new Logger(MedDoseLogsService.name);

  constructor(
    @InjectRepository(MedDoseLog)
    private readonly doseLogs: Repository<MedDoseLog>,
    @InjectRepository(Medication)
    private readonly medications: Repository<Medication>,
    @InjectRepository(MedSchedule)
    private readonly schedules: Repository<MedSchedule>,
    @InjectRepository(Baby) private readonly babies: Repository<Baby>,
  ) {}

  // ----- "Doses de hoje" para um bebê -----
  async findToday(babyId: string, familyId: string): Promise<MedDoseLog[]> {
    await this.assertBabyInFamily(babyId, familyId);

    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return this.doseLogs.find({
      where: {
        babyId,
        scheduledFor: Between(start, end),
      },
      relations: { medication: true, loggedByUser: true },
      order: { scheduledFor: 'ASC' },
    });
  }

  // ----- Histórico com filtros -----
  async findHistory(
    babyId: string,
    familyId: string,
    filter: DoseLogFilterDto,
  ): Promise<MedDoseLog[]> {
    await this.assertBabyInFamily(babyId, familyId);

    const where: FindOptionsWhere<MedDoseLog> = { babyId };
    if (filter.status) where.status = filter.status;
    if (filter.from && filter.to) {
      where.scheduledFor = Between(new Date(filter.from), new Date(filter.to));
    }

    return this.doseLogs.find({
      where,
      relations: { medication: true, loggedByUser: true },
      order: { scheduledFor: 'DESC' },
      take: 200, // limite saudável
    });
  }

  // ----- Marcar como TOMADA -----
  async take(
    logId: string,
    babyId: string,
    familyId: string,
    userId: string,
  ): Promise<MedDoseLog> {
    const log = await this.findOne(logId, babyId, familyId);
    if (log.status === DoseStatus.TAKEN) {
      // idempotente — não erra se já estava marcada
      return log;
    }

    log.status = DoseStatus.TAKEN;
    log.takenAt = new Date();
    log.skipReason = null;
    log.loggedByUserId = userId;
    await this.doseLogs.save(log);

    // Recarrega para popular o loggedByUser atualizado (save não traz relations).
    return this.findOne(logId, babyId, familyId);
  }

  // ----- Marcar como PULADA -----
  async skip(
    logId: string,
    babyId: string,
    familyId: string,
    userId: string,
    dto: SkipDoseDto,
  ): Promise<MedDoseLog> {
    const log = await this.findOne(logId, babyId, familyId);
    if (log.status === DoseStatus.TAKEN) {
      throw new BadRequestException(
        'Dose já marcada como tomada. Edite no PATCH se foi engano.',
      );
    }

    log.status = DoseStatus.SKIPPED;
    log.takenAt = null;
    log.skipReason = dto.reason?.trim() || null;
    log.loggedByUserId = userId;
    await this.doseLogs.save(log);

    return this.findOne(logId, babyId, familyId);
  }

  // ----- Reverter para PENDING (engano) -----
  async resetToPending(
    logId: string,
    babyId: string,
    familyId: string,
    userId: string,
  ): Promise<MedDoseLog> {
    const log = await this.findOne(logId, babyId, familyId);
    log.status = DoseStatus.PENDING;
    log.takenAt = null;
    log.skipReason = null;
    log.loggedByUserId = userId;
    await this.doseLogs.save(log);

    return this.findOne(logId, babyId, familyId);
  }

  // -------------------------------------------------------------------
  // CRON HELPER — chamada pelo CreateDailyDoseLogsJob
  // Cria logs PENDING para todas as combinações (medication ativa × schedule ativo)
  // cuja `daysOfWeekMask` inclui o dia da semana de hoje.
  // Idempotente: índice UNIQUE (scheduleId, scheduledFor) protege duplicação.
  // -------------------------------------------------------------------
  async createTodayLogs(): Promise<number> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const isoDate = today.toISOString().slice(0, 10);

    // Pega todos os schedules ativos cujos remédios estão ativos e dentro do período
    const activeSchedules = await this.schedules
      .createQueryBuilder('schedule')
      .innerJoinAndSelect('schedule.medication', 'med')
      .where('schedule.is_active = true')
      .andWhere('med.is_active = true')
      .andWhere('med.deleted_at IS NULL')
      .andWhere('med.start_date <= :today', { today: isoDate })
      .andWhere('(med.end_date IS NULL OR med.end_date >= :today)', { today: isoDate })
      .getMany();

    let created = 0;
    for (const schedule of activeSchedules) {
      // Filtra por dia da semana
      if (!isDayInMask(schedule.daysOfWeekMask, today)) continue;

      // Monta scheduledFor = today + time (UTC simplificado — em V2 considerar timezone do user)
      const [hh, mm] = schedule.time.split(':').map(Number);
      const scheduledFor = new Date(today);
      scheduledFor.setUTCHours(hh, mm, 0, 0);

      try {
        const log = this.doseLogs.create({
          medicationId: schedule.medicationId,
          scheduleId: schedule.id,
          babyId: schedule.medication.babyId,
          familyId: schedule.medication.familyId,
          scheduledFor,
          status: DoseStatus.PENDING,
        });
        await this.doseLogs.save(log);
        created += 1;
      } catch (err: any) {
        // Erro 23505 = unique_violation. Significa que já existe (rodou 2x). OK.
        if (err?.code !== '23505') {
          this.logger.error(
            `Falha ao criar dose log para schedule=${schedule.id}: ${err?.message}`,
          );
        }
      }
    }

    return created;
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private async findOne(
    logId: string,
    babyId: string,
    familyId: string,
  ): Promise<MedDoseLog> {
    const log = await this.doseLogs.findOne({
      where: { id: logId },
      relations: { medication: true, loggedByUser: true },
    });
    if (!log) throw new NotFoundException('Dose não encontrada');
    if (log.babyId !== babyId || log.familyId !== familyId) {
      throw new ForbiddenException('Dose não pertence ao seu bebê');
    }
    return log;
  }

  private async assertBabyInFamily(babyId: string, familyId: string): Promise<void> {
    const baby = await this.babies.findOne({ where: { id: babyId } });
    if (!baby) throw new NotFoundException('Bebê não encontrado');
    if (baby.familyId !== familyId) {
      throw new ForbiddenException('Bebê não pertence à sua família');
    }
  }
}
