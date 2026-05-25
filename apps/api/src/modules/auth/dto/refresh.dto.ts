import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    example: 'cole_aqui_o_refreshToken_que_voce_recebeu_no_login_ou_register',
    description: 'Refresh token recebido no login/register/refresh anterior',
  })
  @IsString()
  @MinLength(1, { message: 'refreshToken é obrigatório' })
  refreshToken!: string;
}
