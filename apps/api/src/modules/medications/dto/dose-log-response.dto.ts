import { ApiProperty } from '@nestjs/swagger';
import { DoseStatus } from '../../../common/enums/dose-status.enum';
import { DoseUnit } from '../../../common/enums/dose-unit.enum';

// Versão "embedded" do remédio dentro do dose log — info mínima pro mobile
// renderizar a card sem fazer chamada extra.
export class DoseLogMedicationDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'Vitamina D' })
  name!: string;

  @ApiProperty({ example: '400.000' })
  dose!: string;

  @ApiProperty({ enum: DoseUnit })
  doseUnit!: DoseUnit;

  @ApiProperty({ nullable: true })
  instructions!: string | null;
}

export class DoseLogResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  babyId!: string;

  @ApiProperty({ format: 'uuid' })
  familyId!: string;

  @ApiProperty({ format: 'uuid' })
  scheduleId!: string;

  @ApiProperty({ type: DoseLogMedicationDto })
  medication!: DoseLogMedicationDto;

  @ApiProperty({ format: 'date-time' })
  scheduledFor!: string;

  @ApiProperty({ enum: DoseStatus })
  status!: DoseStatus;

  @ApiProperty({ format: 'date-time', nullable: true })
  takenAt!: string | null;

  @ApiProperty({ nullable: true })
  skipReason!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  loggedByUserId!: string | null;

  @ApiProperty({ example: 'Mguib', nullable: true })
  loggedByName!: string | null;
}
