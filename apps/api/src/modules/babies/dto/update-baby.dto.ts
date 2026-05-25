import { PartialType } from '@nestjs/swagger';
import { CreateBabyDto } from './create-baby.dto';

// Versão parcial do CreateBabyDto — todos os campos viram opcionais.
// O class-validator continua aplicando as mesmas regras de tamanho/tipo
// nos campos que vierem.
export class UpdateBabyDto extends PartialType(CreateBabyDto) {}
