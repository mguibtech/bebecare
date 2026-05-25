import { ApiProperty } from '@nestjs/swagger';
import { FamilyInviteStatus } from '../../../common/enums/family-invite-status.enum';

// Representação pública de um convite. Não inclui as FKs internas (createdByUserId)
// para o cliente — em vez disso, expõe o nome de quem criou.
export class InviteResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    example: '123456',
    description: 'Código de 6 dígitos para compartilhar com o convidado',
  })
  code!: string;

  @ApiProperty({ enum: FamilyInviteStatus })
  status!: FamilyInviteStatus;

  @ApiProperty({ format: 'date-time' })
  expiresAt!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({
    description: 'Nome do membro que gerou o convite',
    example: 'Mguib',
  })
  createdByName!: string;
}
