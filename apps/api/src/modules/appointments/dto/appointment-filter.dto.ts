import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsIn, IsOptional } from 'class-validator';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';

export type AppointmentScope = 'upcoming' | 'past' | 'all';

export class AppointmentFilterDto {
  @ApiPropertyOptional({ enum: AppointmentStatus, description: 'Filtra por um status específico' })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiPropertyOptional({
    enum: ['upcoming', 'past', 'all'],
    default: 'all',
    description: 'Atalho: upcoming (scheduledAt >= agora) / past (< agora) / all',
  })
  @IsOptional()
  @IsIn(['upcoming', 'past', 'all'])
  scope?: AppointmentScope;

  @ApiPropertyOptional({ description: 'scheduledAt >= from (ISO date-time)' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'scheduledAt <= to (ISO date-time)' })
  @IsOptional()
  @IsDateString()
  to?: string;
}
