import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CompleteAppointmentDto {
  @ApiPropertyOptional({
    description:
      'Observações da consulta: medidas tomadas (peso, altura), prescrições, próxima visita marcada',
    example:
      'Peso: 8.2kg, Altura: 70cm. Iniciar vitamina D 400UI/dia. Próxima consulta em 3 meses.',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
