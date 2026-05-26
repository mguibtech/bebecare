import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AvatarStyle } from '../../common/enums/avatar-style.enum';
import { Baby } from './entities/baby.entity';
import { CreateBabyDto } from './dto/create-baby.dto';
import { UpdateBabyDto } from './dto/update-baby.dto';

@Injectable()
export class BabiesService {
  constructor(@InjectRepository(Baby) private readonly babies: Repository<Baby>) {}

  // Cria um bebê para a família do user autenticado.
  // Default da avatar_seed: nome do bebê em lowercase com hífens.
  async create(familyId: string, dto: CreateBabyDto): Promise<Baby> {
    const seedDefault = dto.name.toLowerCase().trim().replace(/\s+/g, '-');

    const baby = this.babies.create({
      familyId,
      name: dto.name.trim(),
      sex: dto.sex,
      birthDate: dto.birthDate,
      birthWeightGrams: dto.birthWeightGrams ?? null,
      // numeric do Postgres vem como string — fazemos o cast aqui pra consistência
      birthHeightCm: dto.birthHeightCm !== undefined ? dto.birthHeightCm.toFixed(2) : null,
      bloodType: dto.bloodType ?? null,
      allergies: dto.allergies?.trim() || null,
      eyeColor: dto.eyeColor?.trim() || null,
      notes: dto.notes?.trim() || null,
      avatarStyle: dto.avatarStyle ?? AvatarStyle.LORELEI,
      avatarSeed: (dto.avatarSeed?.trim() || seedDefault).slice(0, 100),
    });

    return this.babies.save(baby);
  }

  // Lista todos os bebês ativos (não soft-deletados) da família.
  async findAllByFamily(familyId: string): Promise<Baby[]> {
    return this.babies.find({
      where: { familyId },
      order: { birthDate: 'ASC' },
    });
  }

  // Busca um bebê específico — valida que pertence à família do user.
  async findOneByFamily(id: string, familyId: string): Promise<Baby> {
    const baby = await this.babies.findOne({ where: { id } });

    if (!baby) {
      throw new NotFoundException('Bebê não encontrado');
    }

    if (baby.familyId !== familyId) {
      throw new ForbiddenException('Este bebê não pertence à sua família');
    }

    return baby;
  }

  // Atualiza um bebê. Só aplica os campos enviados.
  async update(id: string, familyId: string, dto: UpdateBabyDto): Promise<Baby> {
    const baby = await this.findOneByFamily(id, familyId);

    // Campos texto: undefined = não mexer, string vazia = limpar (null)
    if (dto.name !== undefined) baby.name = dto.name.trim();
    if (dto.sex !== undefined) baby.sex = dto.sex;
    if (dto.birthDate !== undefined) baby.birthDate = dto.birthDate;
    if (dto.birthWeightGrams !== undefined) baby.birthWeightGrams = dto.birthWeightGrams;
    if (dto.birthHeightCm !== undefined) {
      baby.birthHeightCm = dto.birthHeightCm.toFixed(2);
    }
    if (dto.bloodType !== undefined) baby.bloodType = dto.bloodType;
    if (dto.allergies !== undefined) baby.allergies = dto.allergies?.trim() || null;
    if (dto.eyeColor !== undefined) baby.eyeColor = dto.eyeColor?.trim() || null;
    if (dto.notes !== undefined) baby.notes = dto.notes?.trim() || null;
    if (dto.avatarStyle !== undefined) baby.avatarStyle = dto.avatarStyle;
    if (dto.avatarSeed !== undefined && dto.avatarSeed.trim()) {
      baby.avatarSeed = dto.avatarSeed.trim().slice(0, 100);
    }

    return this.babies.save(baby);
  }

  // Soft-delete (preenche deleted_at — registros somem das queries por default).
  async remove(id: string, familyId: string): Promise<void> {
    const baby = await this.findOneByFamily(id, familyId);
    await this.babies.softRemove(baby);
  }
}
