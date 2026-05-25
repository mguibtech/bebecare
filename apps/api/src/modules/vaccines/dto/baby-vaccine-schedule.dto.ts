import { ApiProperty } from '@nestjs/swagger';
import { VaccineStatus } from '../../../common/enums/vaccine-status.enum';
import { VaccineCatalogItemDto } from './vaccine-catalog-item.dto';

// Uma entrada do schedule (uma dose por bebê com status calculado).
export class ScheduleEntryDto {
  @ApiProperty({ type: VaccineCatalogItemDto })
  vaccine!: VaccineCatalogItemDto;

  @ApiProperty({ enum: VaccineStatus })
  status!: VaccineStatus;

  @ApiProperty({
    nullable: true,
    example: '2025-10-15',
    description: 'Data em que foi aplicada (se APPLIED). null caso contrário.',
  })
  appliedAt!: string | null;

  @ApiProperty({
    nullable: true,
    format: 'uuid',
    description: 'ID do VaccineRecord, se já aplicada.',
  })
  recordId!: string | null;

  @ApiProperty({
    example: '2025-11-15',
    description: 'Data aproximada em que a dose é esperada (birthDate + recommendedAgeMonths).',
  })
  expectedAt!: string;
}

// Resposta completa do GET /babies/:babyId/vaccine-schedule.
export class BabyVaccineScheduleDto {
  @ApiProperty({ format: 'uuid' })
  babyId!: string;

  @ApiProperty({ example: 'Theo' })
  babyName!: string;

  @ApiProperty({ example: 9 })
  babyAgeMonths!: number;

  @ApiProperty({
    type: [ScheduleEntryDto],
    description: 'Doses agrupadas por status no front (overdue → due → upcoming → applied)',
  })
  entries!: ScheduleEntryDto[];

  @ApiProperty({
    description: 'Resumo de contagens por status (útil para o badge do app)',
    example: { overdue: 1, due: 3, upcoming: 25, applied: 5 },
  })
  summary!: Record<VaccineStatus, number>;
}
