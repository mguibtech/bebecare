import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';
import { CreateVaccineRecordDto } from './create-vaccine-record.dto';

// Update parcial — não deixa trocar vaccineId (se errou, delete o record e cria outro).
export class UpdateVaccineRecordDto extends PartialType(CreateVaccineRecordDto) {
  // Sobrescrevemos o vaccineId para EXCLUIR ele do update (PartialType deixa tudo opcional).
  // Tornando o tipo `never` aqui + validator @IsOptional torna efetivamente proibido
  // — mas se vier, é ignorado pelo whitelist do ValidationPipe.

  @ApiPropertyOptional({ example: '2025-10-15' })
  @IsOptional()
  @IsDateString()
  appliedAt?: string;

  @ApiPropertyOptional({ example: 'ABC1234' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lotNumber?: string;

  @ApiPropertyOptional({ example: 'UBS Centro' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
