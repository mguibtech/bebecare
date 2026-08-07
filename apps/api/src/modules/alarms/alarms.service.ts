import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateAlarmDto } from './dto/create-alarm.dto';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { Alarm } from './entities/alarm.entity';

@Injectable()
export class AlarmsService {
  constructor(
    @InjectRepository(Alarm)
    private readonly alarms: Repository<Alarm>,
  ) {}

  async create(userId: string, dto: CreateAlarmDto): Promise<Alarm> {
    const alarm = this.alarms.create({
      userId,
      label: dto.label.trim(),
      time: dto.time,
      daysOfWeekMask: dto.daysOfWeekMask,
      category: dto.category,
      intervalHours: dto.intervalHours ?? null,
      soundKey: dto.soundKey?.trim() || null,
      isActive: dto.isActive ?? true,
    });
    return this.alarms.save(alarm);
  }

  // Todos os alarmes do usuário, ordenados por horário (o mobile sincroniza
  // tudo e agenda os ativos localmente).
  findAllForUser(userId: string): Promise<Alarm[]> {
    return this.alarms.find({
      where: { userId },
      order: { time: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Alarm> {
    const alarm = await this.alarms.findOne({ where: { id } });
    if (!alarm) throw new NotFoundException('Despertador não encontrado');
    if (alarm.userId !== userId) {
      throw new ForbiddenException('Despertador não pertence a você');
    }
    return alarm;
  }

  async update(id: string, userId: string, dto: UpdateAlarmDto): Promise<Alarm> {
    const alarm = await this.findOne(id, userId);

    if (dto.label !== undefined) alarm.label = dto.label.trim();
    if (dto.time !== undefined) alarm.time = dto.time;
    if (dto.daysOfWeekMask !== undefined) {
      alarm.daysOfWeekMask = dto.daysOfWeekMask;
    }
    if (dto.category !== undefined) alarm.category = dto.category;
    if (dto.intervalHours !== undefined) {
      alarm.intervalHours = dto.intervalHours ?? null;
    }
    if (dto.soundKey !== undefined) alarm.soundKey = dto.soundKey?.trim() || null;
    if (dto.isActive !== undefined) alarm.isActive = dto.isActive;

    return this.alarms.save(alarm);
  }

  async remove(id: string, userId: string): Promise<void> {
    const alarm = await this.findOne(id, userId);
    await this.alarms.softRemove(alarm);
  }
}
