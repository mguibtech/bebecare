import { ApiProperty } from '@nestjs/swagger';
import { DoseUnit } from '../../../common/enums/dose-unit.enum';

export class MedScheduleResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: '08:00' })
  time!: string;

  @ApiProperty({ example: 127 })
  daysOfWeekMask!: number;

  @ApiProperty({ example: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'] })
  daysOfWeekNames!: string[];

  @ApiProperty()
  useAlarm!: boolean;

  @ApiProperty()
  isActive!: boolean;
}

export class MedicationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  babyId!: string;

  @ApiProperty({ format: 'uuid' })
  familyId!: string;

  @ApiProperty({ example: 'Vitamina D' })
  name!: string;

  @ApiProperty({ example: '400.000' })
  dose!: string;

  @ApiProperty({ enum: DoseUnit })
  doseUnit!: DoseUnit;

  @ApiProperty({ nullable: true })
  instructions!: string | null;

  @ApiProperty({ example: '2026-05-25' })
  startDate!: string;

  @ApiProperty({ nullable: true })
  endDate!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty({ type: [MedScheduleResponseDto] })
  schedules!: MedScheduleResponseDto[];

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
