import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class CreateMedScheduleDto {
  @ApiProperty({
    example: '08:00',
    description: 'Hora do dia no formato HH:mm (24h)',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'time deve estar no formato HH:mm (00:00 a 23:59)',
  })
  time!: string;

  @ApiProperty({
    example: 127,
    minimum: 1,
    maximum: 127,
    description:
      'Bitmask 7 bits: dom=1, seg=2, ter=4, qua=8, qui=16, sex=32, sáb=64. 127=todos os dias, 62=dias úteis, 65=fins de semana',
  })
  @IsInt()
  @Min(1)
  @Max(127)
  daysOfWeekMask!: number;

  @ApiPropertyOptional({
    default: true,
    description: 'true = alarme local (notifee) | false = push notification regular',
  })
  @IsOptional()
  @IsBoolean()
  useAlarm?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
