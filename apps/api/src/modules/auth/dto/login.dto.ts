import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'mguib@bebecare.local' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'bebecare123' })
  @IsString()
  @MinLength(1, { message: 'Senha é obrigatória' })
  password!: string;
}
