import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelAppointmentDto {
  @ApiPropertyOptional({
    example: 'Remarcada para a semana que vem',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
