import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateFamilyDto {
  @ApiPropertyOptional({
    example: 'Família Silva',
    description: 'Nome de exibição da família. Pode ser null para limpar.',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @Length(0, 100)
  name?: string | null;
}
