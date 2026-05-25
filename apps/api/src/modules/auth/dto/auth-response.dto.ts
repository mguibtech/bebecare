import { ApiProperty } from '@nestjs/swagger';
import { AvatarStyle } from '../../../common/enums/avatar-style.enum';

// Versão "pública" do User devolvida pelo /auth/* e /auth/me.
// Nunca inclui passwordHash, fcmToken ou timestamps internos sensíveis.
export class UserPublicDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: AvatarStyle })
  avatarStyle!: AvatarStyle;

  @ApiProperty()
  avatarSeed!: string;

  @ApiProperty({ format: 'uuid' })
  familyId!: string;
}

// Versão enxuta de um membro da família (para o /auth/me devolver sem
// expor email/dados privados dos outros membros).
export class FamilyMemberPublicDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: AvatarStyle })
  avatarStyle!: AvatarStyle;

  @ApiProperty()
  avatarSeed!: string;
}

export class FamilySummaryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiProperty({
    type: [FamilyMemberPublicDto],
    description: 'Outros membros da família (não inclui o usuário atual)',
  })
  members!: FamilyMemberPublicDto[];
}

// Resposta dos endpoints /auth/register, /auth/login e /auth/refresh.
export class AuthResponseDto {
  @ApiProperty({ type: UserPublicDto })
  user!: UserPublicDto;

  @ApiProperty({ description: 'JWT de acesso (curta validade)' })
  accessToken!: string;

  @ApiProperty({ description: 'Token de refresh (longa validade)' })
  refreshToken!: string;

  @ApiProperty({ description: 'Segundos até o accessToken expirar', example: 900 })
  expiresIn!: number;
}

// Resposta do /auth/me — não inclui tokens.
export class MeResponseDto {
  @ApiProperty({ type: UserPublicDto })
  user!: UserPublicDto;

  @ApiProperty({ type: FamilySummaryDto })
  family!: FamilySummaryDto;
}
