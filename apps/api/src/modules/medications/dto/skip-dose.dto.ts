import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SkipDoseDto {
  @ApiPropertyOptional({
    example: 'Bebê dormindo, vamos tentar mais tarde',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}
