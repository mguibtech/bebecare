import { PartialType } from '@nestjs/swagger';
import { CreateMedScheduleDto } from './create-med-schedule.dto';

export class UpdateMedScheduleDto extends PartialType(CreateMedScheduleDto) {}
