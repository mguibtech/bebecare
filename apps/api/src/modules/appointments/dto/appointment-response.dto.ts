import { ApiProperty } from '@nestjs/swagger';
import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';

export class AppointmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  babyId!: string;

  @ApiProperty({ format: 'uuid' })
  familyId!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  doctorName!: string | null;

  @ApiProperty({ nullable: true })
  specialty!: string | null;

  @ApiProperty({ format: 'date-time' })
  scheduledAt!: string;

  @ApiProperty({ nullable: true })
  location!: string | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  @ApiProperty({ enum: AppointmentStatus })
  status!: AppointmentStatus;

  @ApiProperty()
  reminderEnabled!: boolean;

  @ApiProperty({ example: 1440 })
  reminderMinutesBefore!: number;

  @ApiProperty({ format: 'date-time', nullable: true })
  completedAt!: string | null;

  @ApiProperty({ nullable: true })
  completedNotes!: string | null;

  @ApiProperty({ format: 'date-time', nullable: true })
  canceledAt!: string | null;

  @ApiProperty({ nullable: true })
  cancelReason!: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: string;
}
