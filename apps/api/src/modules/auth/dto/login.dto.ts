import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'mguib@example.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'minhaSenhaSegura' })
  @IsString()
  @MinLength(1, { message: 'Senha é obrigatória' })
  password!: string;
}
