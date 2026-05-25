import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    description: 'Refresh token recebido no login/register/refresh anterior',
  })
  @IsString()
  @MinLength(1, { message: 'refreshToken é obrigatório' })
  refreshToken!: string;
}
