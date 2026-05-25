import { ApiProperty } from '@nestjs/swagger';
import { VaccineCatalogItemDto } from './vaccine-catalog-item.dto';

export class VaccineRecordResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  babyId!: string;

  @ApiProperty({ format: 'uuid' })
  familyId!: string;

  @ApiProperty({ type: VaccineCatalogItemDto, description: 'Dados da vacina aplicada' })
  vaccine!: VaccineCatalogItemDto;

  @ApiProperty({ example: '2025-10-15' })
  appliedAt!: string;

  @ApiProperty({ nullable: true })
  lotNumber!: string | null;

  @ApiProperty({ nullable: true })
  location!: string | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;
}
