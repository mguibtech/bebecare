import { ApiProperty } from '@nestjs/swagger';
import { AvatarStyle } from '../../../common/enums/avatar-style.enum';
import { BloodType } from '../../../common/enums/blood-type.enum';
import { Sex } from '../../../common/enums/sex.enum';

// Resposta pública do bebê. Inclui idade calculada (meses + dias) que o mobile
// usa em vários lugares — fazemos no back uma vez pra evitar lógica duplicada.
export class BabyResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  familyId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: Sex })
  sex!: Sex;

  @ApiProperty({ example: '2025-08-15' })
  birthDate!: string;

  @ApiProperty({ description: 'Idade do bebê em meses inteiros', example: 9 })
  ageMonths!: number;

  @ApiProperty({ description: 'Idade em dias totais', example: 274 })
  ageDays!: number;

  @ApiProperty({ nullable: true, example: 3450 })
  birthWeightGrams!: number | null;

  @ApiProperty({ nullable: true, example: '49.50' })
  birthHeightCm!: string | null;

  @ApiProperty({ nullable: true, enum: BloodType })
  bloodType!: BloodType | null;

  @ApiProperty({ nullable: true, example: 'Leite de vaca, ovos' })
  allergies!: string | null;

  @ApiProperty({ nullable: true, example: 'castanho' })
  eyeColor!: string | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty({ enum: AvatarStyle })
  avatarStyle!: AvatarStyle;

  @ApiProperty()
  avatarSeed!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
