import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AvatarStyle } from '../../../common/enums/avatar-style.enum';
import { BloodType } from '../../../common/enums/blood-type.enum';
import { Sex } from '../../../common/enums/sex.enum';

export class CreateBabyDto {
  @ApiProperty({ example: 'Theo', minLength: 1, maxLength: 120 })
  @IsString()
  @Length(1, 120)
  name!: string;

  @ApiProperty({ enum: Sex, example: Sex.MALE })
  @IsEnum(Sex)
  sex!: Sex;

  @ApiProperty({ example: '2025-08-15', description: 'Data de nascimento (YYYY-MM-DD)' })
  @IsDateString()
  birthDate!: string;

  // -------- Medidas ao nascer (opcionais) --------
  @ApiPropertyOptional({ example: 3450, minimum: 300, maximum: 8000 })
  @IsOptional()
  @IsInt()
  @Min(300)
  @Max(8000)
  birthWeightGrams?: number;

  @ApiPropertyOptional({ example: 49.5, minimum: 20, maximum: 70 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(20)
  @Max(70)
  birthHeightCm?: number;

  // -------- Médicos opcionais --------
  @ApiPropertyOptional({ enum: BloodType, example: BloodType.O_POSITIVE })
  @IsOptional()
  @IsEnum(BloodType)
  bloodType?: BloodType;

  @ApiPropertyOptional({ example: 'Leite de vaca, ovos', maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  allergies?: string;

  @ApiPropertyOptional({ example: 'castanho', maxLength: 30 })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  eyeColor?: string;

  @ApiPropertyOptional({ description: 'Observações livres dos pais' })
  @IsOptional()
  @IsString()
  notes?: string;

  // -------- Avatar opcional (default lorelei + seed = nome do bebê) --------
  @ApiPropertyOptional({ enum: AvatarStyle, default: AvatarStyle.LORELEI })
  @IsOptional()
  @IsEnum(AvatarStyle)
  avatarStyle?: AvatarStyle;

  @ApiPropertyOptional({
    example: 'theo',
    description: 'Seed do DiceBear (default = nome do bebê em lowercase com hífens)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  avatarSeed?: string;
}
