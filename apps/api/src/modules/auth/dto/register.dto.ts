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
  @ApiProperty({
    example: 'mguib@bebecare.local',
    description: 'Email único — usado para login',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email!: string;

  @ApiProperty({
    example: 'Mguib',
    minLength: 2,
    maxLength: 120,
    description: 'Nome de exibição no perfil',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @Length(2, 120, { message: 'Nome deve ter entre 2 e 120 caracteres' })
  name!: string;

  @ApiProperty({
    example: 'bebecare123',
    minLength: 8,
    description: 'Mínimo 8 caracteres',
  })
  @IsString()
  @MinLength(8, { message: 'Senha precisa ter ao menos 8 caracteres' })
  password!: string;

  // Opcional. Se enviado, o usuário será inserido na família do convite
  // ao invés de criar uma família nova.
  @ApiPropertyOptional({
    example: '123456',
    description:
      'Código de convite de 6 dígitos (opcional). Se informado, entra na família existente em vez de criar uma nova solo.',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{6}$/, { message: 'Código de convite deve ter 6 dígitos numéricos' })
  inviteCode?: string;
}
