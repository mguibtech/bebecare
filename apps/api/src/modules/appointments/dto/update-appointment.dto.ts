import { PartialType } from '@nestjs/swagger';
import { CreateAppointmentDto } from './create-appointment.dto';

// Todos os campos viram opcionais. Não permite mudar status diretamente —
// use os endpoints /complete e /cancel pra isso.
export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {}
