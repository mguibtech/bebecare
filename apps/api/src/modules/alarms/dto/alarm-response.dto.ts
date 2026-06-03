import { ApiProperty } from '@nestjs/swagger';
import { AlarmCategory } from '../../../common/enums/alarm-category.enum';

export class AlarmResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ example: '06:00' })
  time!: string;

  @ApiProperty({ example: 127 })
  daysOfWeekMask!: number;

  @ApiProperty({ enum: AlarmCategory })
  category!: AlarmCategory;

  @ApiProperty({ nullable: true })
  soundKey!: string | null;

  @ApiProperty()
  isActive!: boolean;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
