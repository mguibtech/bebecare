import { PartialType } from '@nestjs/swagger';
import { CreateAlarmDto } from './create-alarm.dto';

// Todos os campos do create viram opcionais. Atualização parcial.
export class UpdateAlarmDto extends PartialType(CreateAlarmDto) {}
