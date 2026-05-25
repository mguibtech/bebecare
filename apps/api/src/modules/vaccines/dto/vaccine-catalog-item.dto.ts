import { ApiProperty } from '@nestjs/swagger';

// Representação pública de uma entrada do catálogo PNI.
export class VaccineCatalogItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'PENTA_1' })
  code!: string;

  @ApiProperty({ example: 'Pentavalente' })
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ example: '1ª dose' })
  doseLabel!: string;

  @ApiProperty({ example: 1 })
  doseNumber!: number;

  @ApiProperty({ example: false })
  isBooster!: boolean;

  @ApiProperty({ example: 2, description: 'Idade recomendada em meses' })
  recommendedAgeMonths!: number;

  @ApiProperty({ example: 2 })
  minAgeMonths!: number;

  @ApiProperty({ nullable: true, example: null })
  maxAgeMonths!: number | null;

  @ApiProperty({ example: 30 })
  displayOrder!: number;
}
