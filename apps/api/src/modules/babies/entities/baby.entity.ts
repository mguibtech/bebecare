import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { Sex } from '../../../common/enums/sex.enum';
import { Family } from '../../families/entities/family.entity';

// Bebê cadastrado pela família. V1 guarda apenas dados de nascimento — medidas
// atuais (peso/altura ao longo do tempo) e curvas de crescimento ficam para V2.
@Entity('babies')
export class Baby extends SoftDeletableEntity {
  // Dono — a família que cadastrou. Todos os membros podem ver/editar.
  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => Family, (family) => family.babies, {
    nullable: false,
    onDelete: 'CASCADE', // se a família for hard-deleted (raro), bebês vão junto
  })
  @JoinColumn({ name: 'family_id' })
  family!: Family;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ type: 'enum', enum: Sex })
  sex!: Sex;

  // Data de nascimento (sem hora — apenas data)
  @Column({ name: 'birth_date', type: 'date' })
  birthDate!: string; // 'YYYY-MM-DD'

  // Medidas ao nascer (opcionais — alguns pais não têm o cartão da maternidade à mão)
  @Column({ name: 'birth_weight_grams', type: 'int', nullable: true })
  birthWeightGrams: number | null = null;

  @Column({ name: 'birth_height_cm', type: 'numeric', precision: 5, scale: 2, nullable: true })
  birthHeightCm: string | null = null; // numeric vem como string no driver pg
}
