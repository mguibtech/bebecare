import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

// Opções de minutos antes oferecidas pelo mobile.
// O backend aceita qualquer inteiro positivo, mas o mobile vai oferecer essas.
export const REMINDER_OPTIONS = [30, 60, 180, 1440, 10080] as const;
// 30m, 1h, 3h, 1 dia, 1 semana

export class CreateAppointmentDto {
  @ApiProperty({ example: 'Puericultura', minLength: 1, maxLength: 120 })
  @IsString()
  @Length(1, 120)
  title!: string;

  @ApiPropertyOptional({ example: 'Dra. Ana Souza', maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  doctorName?: string;

  @ApiPropertyOptional({ example: 'Pediatra', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  specialty?: string;

  @ApiProperty({
    example: '2026-06-10T14:30:00.000Z',
    description: 'Data e hora da consulta (ISO 8601, com timezone)',
  })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ example: 'Clínica Vida — Rua X, 123', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({
    description: 'Anotações: perguntas a fazer, sintomas observados, etc.',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Se true, dispara push notification antes da consulta',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  reminderEnabled?: boolean;

  @ApiPropertyOptional({
    enum: REMINDER_OPTIONS,
    example: 1440,
    description: 'Minutos antes do scheduledAt: 30 / 60 / 180 / 1440 (1 dia) / 10080 (1 semana)',
    default: 1440,
  })
  @IsOptional()
  @IsInt()
  @IsIn([...REMINDER_OPTIONS])
  reminderMinutesBefore?: number;
}
