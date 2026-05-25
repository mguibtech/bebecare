import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';
import { AvatarStyle } from '../../../common/enums/avatar-style.enum';

// DTO para PATCH /users/me — edita nome e/ou avatar do usuário autenticado.
// Cada campo é opcional; só os enviados são atualizados.
export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Mguib', minLength: 2, maxLength: 120 })
  @IsOptional()
  @IsString()
  @Length(2, 120)
  name?: string;

  @ApiPropertyOptional({ enum: AvatarStyle })
  @IsOptional()
  @IsEnum(AvatarStyle)
  avatarStyle?: AvatarStyle;

  @ApiPropertyOptional({
    example: 'mguib',
    description: 'Seed do DiceBear (qualquer string razoável)',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  avatarSeed?: string;
}
