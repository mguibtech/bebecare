import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { AlarmCategory } from '../../../common/enums/alarm-category.enum';

export class CreateAlarmDto {
  @ApiProperty({ example: 'Mamada da manhã', minLength: 1, maxLength: 80 })
  @IsString()
  @Length(1, 80)
  label!: string;

  @ApiProperty({ example: '06:00', description: 'Hora do dia em HH:mm (24h)' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'time deve ser HH:mm (24h)' })
  time!: string;

  @ApiProperty({
    example: 127,
    minimum: 1,
    maximum: 127,
    description:
      'Bitmask de dias (dom=1, seg=2, ter=4, qua=8, qui=16, sex=32, sáb=64). 127 = todos.',
  })
  @IsInt()
  @Min(1)
  @Max(127)
  daysOfWeekMask!: number;

  @ApiPropertyOptional({
    enum: AlarmCategory,
    default: AlarmCategory.CUSTOM,
    description: 'feeding / diaper / nap / custom',
  })
  @IsOptional()
  @IsEnum(AlarmCategory)
  category?: AlarmCategory;

  @ApiPropertyOptional({
    example: 3,
    enum: [2, 3, 4, 6],
    description:
      'Modo intervalo: toca a cada N horas a partir de `time` (24h). ' +
      'Omitir/null = horário único. Divisores de 24 pra cobertura uniforme.',
  })
  @IsOptional()
  @IsInt()
  @IsIn([2, 3, 4, 6])
  intervalHours?: number;

  @ApiPropertyOptional({
    example: 'soft-chime',
    maxLength: 60,
    description: 'Chave de um som interno. Omitir = som padrão do alarme.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  soundKey?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
