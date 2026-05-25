import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Baby } from '../babies/entities/baby.entity';
import { CreateVaccineRecordDto } from './dto/create-vaccine-record.dto';
import { UpdateVaccineRecordDto } from './dto/update-vaccine-record.dto';
import { VaccineRecord } from './entities/vaccine-record.entity';
import { Vaccine } from './entities/vaccine.entity';

@Injectable()
export class VaccineRecordsService {
  constructor(
    @InjectRepository(VaccineRecord)
    private readonly records: Repository<VaccineRecord>,
    @InjectRepository(Vaccine) private readonly vaccines: Repository<Vaccine>,
    @InjectRepository(Baby) private readonly babies: Repository<Baby>,
  ) {}

  // Cria um record de vacina para um bebê. Valida:
  //  - Bebê existe e pertence à família do user
  //  - Vacina existe no catálogo
  //  - Não há duplicação (uma vacina por bebê — o índice unique já protege,
  //    mas validamos antes para uma mensagem de erro amigável)
  async create(
    babyId: string,
    familyId: string,
    dto: CreateVaccineRecordDto,
  ): Promise<VaccineRecord> {
    const baby = await this.babies.findOne({ where: { id: babyId } });
    if (!baby) throw new NotFoundException('Bebê não encontrado');
    if (baby.familyId !== familyId) {
      throw new ForbiddenException('Bebê não pertence à sua família');
    }

    const vaccine = await this.vaccines.findOne({ where: { id: dto.vaccineId } });
    if (!vaccine) throw new NotFoundException('Vacina não encontrada no catálogo');

    const existing = await this.records.findOne({
      where: { babyId, vaccineId: vaccine.id },
    });
    if (existing) {
      throw new ConflictException(
        'Esta dose já foi registrada para este bebê. Para corrigir, edite o registro existente.',
      );
    }

    const record = this.records.create({
      babyId,
      vaccineId: vaccine.id,
      familyId,
      appliedAt: dto.appliedAt,
      lotNumber: dto.lotNumber?.trim() || null,
      location: dto.location?.trim() || null,
      notes: dto.notes?.trim() || null,
    });

    return this.records.save(record);
  }

  // Lista records de um bebê, com a vacina populada (pra exibir nome/código).
  async findAllByBaby(babyId: string, familyId: string): Promise<VaccineRecord[]> {
    await this.assertBabyBelongsToFamily(babyId, familyId);
    return this.records.find({
      where: { babyId },
      relations: { vaccine: true },
      order: { appliedAt: 'DESC' },
    });
  }

  async update(
    recordId: string,
    babyId: string,
    familyId: string,
    dto: UpdateVaccineRecordDto,
  ): Promise<VaccineRecord> {
    const record = await this.records.findOne({
      where: { id: recordId },
      relations: { vaccine: true },
    });
    if (!record) throw new NotFoundException('Registro não encontrado');
    if (record.babyId !== babyId || record.familyId !== familyId) {
      throw new ForbiddenException('Registro não pertence ao seu bebê');
    }

    if (dto.appliedAt !== undefined) record.appliedAt = dto.appliedAt;
    if (dto.lotNumber !== undefined) record.lotNumber = dto.lotNumber?.trim() || null;
    if (dto.location !== undefined) record.location = dto.location?.trim() || null;
    if (dto.notes !== undefined) record.notes = dto.notes?.trim() || null;

    return this.records.save(record);
  }

  async remove(recordId: string, babyId: string, familyId: string): Promise<void> {
    const record = await this.records.findOne({ where: { id: recordId } });
    if (!record) throw new NotFoundException('Registro não encontrado');
    if (record.babyId !== babyId || record.familyId !== familyId) {
      throw new ForbiddenException('Registro não pertence ao seu bebê');
    }
    await this.records.remove(record);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private async assertBabyBelongsToFamily(
    babyId: string,
    familyId: string,
  ): Promise<void> {
    const baby = await this.babies.findOne({ where: { id: babyId } });
    if (!baby) throw new NotFoundException('Bebê não encontrado');
    if (baby.familyId !== familyId) {
      throw new ForbiddenException('Bebê não pertence à sua família');
    }
  }
}
