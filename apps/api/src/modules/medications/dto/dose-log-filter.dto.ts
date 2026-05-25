import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { DoseStatus } from '../../../common/enums/dose-status.enum';

export class DoseLogFilterDto {
  @ApiPropertyOptional({ enum: DoseStatus })
  @IsOptional()
  @IsEnum(DoseStatus)
  status?: DoseStatus;

  @ApiPropertyOptional({ description: 'scheduledFor >= from (ISO date-time)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'scheduledFor <= to (ISO date-time)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
