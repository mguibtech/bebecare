import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'mguib@example.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({ example: 'Mguib', minLength: 2, maxLength: 120 })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @Length(2, 120, { message: 'Nome deve ter entre 2 e 120 caracteres' })
  name!: string;

  @ApiProperty({ example: 'minhaSenhaSegura', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Senha precisa ter ao menos 8 caracteres' })
  password!: string;

  // Opcional. Se enviado, o usuário será inserido no casal do convite
  // ao invés de criar um casal novo.
  @ApiPropertyOptional({
    example: '123456',
    description: 'Código de convite de 6 dígitos (opcional)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Código de convite deve ter 6 dígitos numéricos' })
  inviteCode?: string;
}
