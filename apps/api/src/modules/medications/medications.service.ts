import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Baby } from '../babies/entities/baby.entity';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { Medication } from './entities/medication.entity';

@Injectable()
export class MedicationsService {
  constructor(
    @InjectRepository(Medication)
    private readonly medications: Repository<Medication>,
    @InjectRepository(Baby) private readonly babies: Repository<Baby>,
  ) {}

  async create(
    babyId: string,
    familyId: string,
    dto: CreateMedicationDto,
  ): Promise<Medication> {
    await this.assertBabyInFamily(babyId, familyId);

    const med = this.medications.create({
      babyId,
      familyId,
      name: dto.name.trim(),
      dose: dto.dose.toFixed(3),
      doseUnit: dto.doseUnit,
      instructions: dto.instructions?.trim() || null,
      startDate: dto.startDate,
      endDate: dto.endDate ?? null,
      isActive: dto.isActive ?? true,
    });

    return this.medications.save(med);
  }

  async findAllByBaby(babyId: string, familyId: string): Promise<Medication[]> {
    await this.assertBabyInFamily(babyId, familyId);
    return this.medications.find({
      where: { babyId },
      relations: { schedules: true },
      order: { startDate: 'DESC' },
    });
  }

  async findOne(id: string, babyId: string, familyId: string): Promise<Medication> {
    const med = await this.medications.findOne({
      where: { id },
      relations: { schedules: true },
    });
    if (!med) throw new NotFoundException('Remédio não encontrado');
    if (med.babyId !== babyId || med.familyId !== familyId) {
      throw new ForbiddenException('Remédio não pertence a este bebê');
    }
    return med;
  }

  async update(
    id: string,
    babyId: string,
    familyId: string,
    dto: UpdateMedicationDto,
  ): Promise<Medication> {
    const med = await this.findOne(id, babyId, familyId);

    if (dto.name !== undefined) med.name = dto.name.trim();
    if (dto.dose !== undefined) med.dose = dto.dose.toFixed(3);
    if (dto.doseUnit !== undefined) med.doseUnit = dto.doseUnit;
    if (dto.instructions !== undefined) {
      med.instructions = dto.instructions?.trim() || null;
    }
    if (dto.startDate !== undefined) med.startDate = dto.startDate;
    if (dto.endDate !== undefined) med.endDate = dto.endDate ?? null;
    if (dto.isActive !== undefined) med.isActive = dto.isActive;

    return this.medications.save(med);
  }

  async remove(id: string, babyId: string, familyId: string): Promise<void> {
    const med = await this.findOne(id, babyId, familyId);
    await this.medications.softRemove(med);
  }

  private async assertBabyInFamily(babyId: string, familyId: string): Promise<void> {
    const baby = await this.babies.findOne({ where: { id: babyId } });
    if (!baby) throw new NotFoundException('Bebê não encontrado');
    if (baby.familyId !== familyId) {
      throw new ForbiddenException('Bebê não pertence à sua família');
    }
  }
}
