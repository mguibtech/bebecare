import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { DoseUnit } from '../../../common/enums/dose-unit.enum';

export class CreateMedicationDto {
  @ApiProperty({ example: 'Vitamina D', minLength: 1, maxLength: 120 })
  @IsString()
  @Length(1, 120)
  name!: string;

  @ApiProperty({
    example: 400,
    description: 'Valor numérico da dose (aceita decimais até 3 casas)',
    minimum: 0.001,
  })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  @Max(99999.999)
  dose!: number;

  @ApiProperty({ enum: DoseUnit, example: DoseUnit.DROP })
  @IsEnum(DoseUnit)
  doseUnit!: DoseUnit;

  @ApiPropertyOptional({ example: 'Junto com o leite, após o banho' })
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiProperty({ example: '2026-05-25', description: 'Data de início (YYYY-MM-DD)' })
  @IsDateString()
  startDate!: string;

  @ApiPropertyOptional({
    example: '2026-08-25',
    description: 'Data fim do tratamento. Omita para uso contínuo.',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
