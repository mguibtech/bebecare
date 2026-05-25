import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateMedScheduleDto } from './dto/create-med-schedule.dto';
import { UpdateMedScheduleDto } from './dto/update-med-schedule.dto';
import { MedSchedule } from './entities/med-schedule.entity';
import { Medication } from './entities/medication.entity';

@Injectable()
export class MedSchedulesService {
  constructor(
    @InjectRepository(MedSchedule)
    private readonly schedules: Repository<MedSchedule>,
    @InjectRepository(Medication)
    private readonly medications: Repository<Medication>,
  ) {}

  async create(
    medicationId: string,
    babyId: string,
    familyId: string,
    dto: CreateMedScheduleDto,
  ): Promise<MedSchedule> {
    await this.assertMedicationInFamily(medicationId, babyId, familyId);

    const schedule = this.schedules.create({
      medicationId,
      time: dto.time,
      daysOfWeekMask: dto.daysOfWeekMask,
      useAlarm: dto.useAlarm ?? true,
      isActive: dto.isActive ?? true,
    });

    return this.schedules.save(schedule);
  }

  async update(
    scheduleId: string,
    medicationId: string,
    babyId: string,
    familyId: string,
    dto: UpdateMedScheduleDto,
  ): Promise<MedSchedule> {
    const schedule = await this.findOne(scheduleId, medicationId, babyId, familyId);

    if (dto.time !== undefined) schedule.time = dto.time;
    if (dto.daysOfWeekMask !== undefined) schedule.daysOfWeekMask = dto.daysOfWeekMask;
    if (dto.useAlarm !== undefined) schedule.useAlarm = dto.useAlarm;
    if (dto.isActive !== undefined) schedule.isActive = dto.isActive;

    return this.schedules.save(schedule);
  }

  async remove(
    scheduleId: string,
    medicationId: string,
    babyId: string,
    familyId: string,
  ): Promise<void> {
    const schedule = await this.findOne(scheduleId, medicationId, babyId, familyId);
    await this.schedules.remove(schedule);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private async findOne(
    scheduleId: string,
    medicationId: string,
    babyId: string,
    familyId: string,
  ): Promise<MedSchedule> {
    const schedule = await this.schedules.findOne({
      where: { id: scheduleId },
      relations: { medication: true },
    });
    if (!schedule) throw new NotFoundException('Horário não encontrado');
    if (
      schedule.medicationId !== medicationId ||
      schedule.medication.babyId !== babyId ||
      schedule.medication.familyId !== familyId
    ) {
      throw new ForbiddenException('Horário não pertence ao seu remédio');
    }
    return schedule;
  }

  private async assertMedicationInFamily(
    medicationId: string,
    babyId: string,
    familyId: string,
  ): Promise<void> {
    const med = await this.medications.findOne({ where: { id: medicationId } });
    if (!med) throw new NotFoundException('Remédio não encontrado');
    if (med.babyId !== babyId || med.familyId !== familyId) {
      throw new ForbiddenException('Remédio não pertence à sua família');
    }
  }
}
