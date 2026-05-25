import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, LessThan, MoreThanOrEqual, Repository } from 'typeorm';
import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { Baby } from '../babies/entities/baby.entity';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointments: Repository<Appointment>,
    @InjectRepository(Baby) private readonly babies: Repository<Baby>,
  ) {}

  // ------------------------------------------------------------------
  // CREATE
  // ------------------------------------------------------------------
  async create(
    babyId: string,
    familyId: string,
    dto: CreateAppointmentDto,
  ): Promise<Appointment> {
    await this.assertBabyInFamily(babyId, familyId);

    const scheduled = new Date(dto.scheduledAt);
    if (isNaN(scheduled.getTime())) {
      throw new BadRequestException('scheduledAt inválido');
    }

    // Se já é passado, registra direto como COMPLETED (caso de importar histórico).
    // O user pode mudar via update se for engano.
    const isPast = scheduled.getTime() < Date.now();
    const initialStatus = isPast ? AppointmentStatus.COMPLETED : AppointmentStatus.SCHEDULED;
    const completedAt = isPast ? new Date() : null;

    const appointment = this.appointments.create({
      babyId,
      familyId,
      title: dto.title.trim(),
      doctorName: dto.doctorName?.trim() || null,
      specialty: dto.specialty?.trim() || null,
      scheduledAt: scheduled,
      location: dto.location?.trim() || null,
      notes: dto.notes?.trim() || null,
      status: initialStatus,
      reminderEnabled: dto.reminderEnabled ?? true,
      reminderMinutesBefore: dto.reminderMinutesBefore ?? 1440,
      completedAt,
    });

    return this.appointments.save(appointment);
  }

  // ------------------------------------------------------------------
  // LIST
  // ------------------------------------------------------------------
  async findByBaby(
    babyId: string,
    familyId: string,
    filter: AppointmentFilterDto,
  ): Promise<Appointment[]> {
    await this.assertBabyInFamily(babyId, familyId);

    const where: FindOptionsWhere<Appointment> = { babyId };

    if (filter.status) where.status = filter.status;

    if (filter.scope === 'upcoming') {
      where.scheduledAt = MoreThanOrEqual(new Date());
    } else if (filter.scope === 'past') {
      where.scheduledAt = LessThan(new Date());
    }

    // Range explícito sobrescreve scope se ambos forem enviados
    if (filter.from) where.scheduledAt = MoreThanOrEqual(new Date(filter.from));
    if (filter.to) {
      // Combina (>= from AND <= to) — TypeORM precisa de Between aqui
      const from = filter.from ? new Date(filter.from) : new Date(0);
      const to = new Date(filter.to);
      where.scheduledAt = Between(from, to);
    }

    return this.appointments.find({
      where,
      order: { scheduledAt: filter.scope === 'past' ? 'DESC' : 'ASC' },
    });
  }

  // ------------------------------------------------------------------
  // GET ONE
  // ------------------------------------------------------------------
  async findOne(id: string, babyId: string, familyId: string): Promise<Appointment> {
    const appt = await this.appointments.findOne({ where: { id } });
    if (!appt) throw new NotFoundException('Consulta não encontrada');
    if (appt.babyId !== babyId || appt.familyId !== familyId) {
      throw new ForbiddenException('Consulta não pertence a este bebê');
    }
    return appt;
  }

  // ------------------------------------------------------------------
  // UPDATE
  // ------------------------------------------------------------------
  async update(
    id: string,
    babyId: string,
    familyId: string,
    dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appt = await this.findOne(id, babyId, familyId);

    if (dto.title !== undefined) appt.title = dto.title.trim();
    if (dto.doctorName !== undefined) appt.doctorName = dto.doctorName?.trim() || null;
    if (dto.specialty !== undefined) appt.specialty = dto.specialty?.trim() || null;
    if (dto.scheduledAt !== undefined) appt.scheduledAt = new Date(dto.scheduledAt);
    if (dto.location !== undefined) appt.location = dto.location?.trim() || null;
    if (dto.notes !== undefined) appt.notes = dto.notes?.trim() || null;
    if (dto.reminderEnabled !== undefined) appt.reminderEnabled = dto.reminderEnabled;
    if (dto.reminderMinutesBefore !== undefined) {
      appt.reminderMinutesBefore = dto.reminderMinutesBefore;
    }

    return this.appointments.save(appt);
  }

  // ------------------------------------------------------------------
  // COMPLETE
  // ------------------------------------------------------------------
  async complete(
    id: string,
    babyId: string,
    familyId: string,
    dto: CompleteAppointmentDto,
  ): Promise<Appointment> {
    const appt = await this.findOne(id, babyId, familyId);

    if (appt.status === AppointmentStatus.CANCELED) {
      throw new BadRequestException(
        'Consulta foi cancelada. Reabra editando ou crie uma nova.',
      );
    }

    appt.status = AppointmentStatus.COMPLETED;
    appt.completedAt = new Date();
    if (dto.notes !== undefined) appt.completedNotes = dto.notes?.trim() || null;

    return this.appointments.save(appt);
  }

  // ------------------------------------------------------------------
  // CANCEL
  // ------------------------------------------------------------------
  async cancel(
    id: string,
    babyId: string,
    familyId: string,
    dto: CancelAppointmentDto,
  ): Promise<Appointment> {
    const appt = await this.findOne(id, babyId, familyId);

    if (appt.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'Consulta já realizada. Pra esconder, exclua (DELETE).',
      );
    }

    appt.status = AppointmentStatus.CANCELED;
    appt.canceledAt = new Date();
    if (dto.reason !== undefined) appt.cancelReason = dto.reason?.trim() || null;

    return this.appointments.save(appt);
  }

  // ------------------------------------------------------------------
  // REMOVE (soft delete)
  // ------------------------------------------------------------------
  async remove(id: string, babyId: string, familyId: string): Promise<void> {
    const appt = await this.findOne(id, babyId, familyId);
    await this.appointments.softRemove(appt);
  }

  // ------------------------------------------------------------------
  // CRON helper: marca SCHEDULED com scheduledAt < (now - 24h) como MISSED
  // ------------------------------------------------------------------
  async markPastDueAsMissed(graceHours = 24): Promise<number> {
    const cutoff = new Date(Date.now() - graceHours * 3600 * 1000);
    const result = await this.appointments
      .createQueryBuilder()
      .update(Appointment)
      .set({ status: AppointmentStatus.MISSED })
      .where('status = :scheduled', { scheduled: AppointmentStatus.SCHEDULED })
      .andWhere('scheduled_at < :cutoff', { cutoff })
      .andWhere('deleted_at IS NULL')
      .execute();

    return result.affected ?? 0;
  }

  // ------------------------------------------------------------------
  // HELPERS
  // ------------------------------------------------------------------
  private async assertBabyInFamily(babyId: string, familyId: string): Promise<void> {
    const baby = await this.babies.findOne({ where: { id: babyId } });
    if (!baby) throw new NotFoundException('Bebê não encontrado');
    if (baby.familyId !== familyId) {
      throw new ForbiddenException('Bebê não pertence à sua família');
    }
  }
}
