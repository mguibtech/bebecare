import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

// PUT /users/me/fcm-token. O mobile chama no boot/login pra registrar o token
// FCM atual. Aceita null para "remover token" (ex: usuário fez logout local).
export class UpdateFcmTokenDto {
  @ApiProperty({
    nullable: true,
    description: 'Token FCM do device atual. Null remove o token registrado.',
    example: 'cTzN9...long_token_string',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fcmToken!: string | null;
}
