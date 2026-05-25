import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateVaccineRecordDto {
  @ApiProperty({ format: 'uuid', description: 'ID da vacina (do catálogo PNI)' })
  @IsUUID()
  vaccineId!: string;

  @ApiProperty({
    example: '2025-10-15',
    description: 'Data em que a dose foi aplicada (YYYY-MM-DD)',
  })
  @IsDateString()
  appliedAt!: string;

  @ApiPropertyOptional({ example: 'ABC1234', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lotNumber?: string;

  @ApiPropertyOptional({ example: 'UBS Centro', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ description: 'Observações sobre a aplicação' })
  @IsOptional()
  @IsString()
  notes?: string;
}
