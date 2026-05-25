import { ApiProperty } from '@nestjs/swagger';
import { AvatarStyle } from '../../../common/enums/avatar-style.enum';
import { InviteResponseDto } from './invite-response.dto';

// Versão "público da família" de um membro — não vaza email/timestamps internos.
export class FamilyMemberDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: AvatarStyle })
  avatarStyle!: AvatarStyle;

  @ApiProperty()
  avatarSeed!: string;

  @ApiProperty({
    description: 'Indica se este membro é o usuário autenticado',
    example: true,
  })
  isMe!: boolean;
}

export class FamilyDetailsDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ nullable: true, example: null })
  name!: string | null;

  @ApiProperty({
    type: [FamilyMemberDto],
    description: 'Todos os membros da família (inclui o usuário atual)',
  })
  members!: FamilyMemberDto[];

  @ApiProperty({
    type: [InviteResponseDto],
    description: 'Convites pendentes (não expirados)',
  })
  pendingInvites!: InviteResponseDto[];

  @ApiProperty({
    description: 'Quantidade máxima de membros permitida na V1',
    example: 4,
  })
  maxMembers!: number;
}
