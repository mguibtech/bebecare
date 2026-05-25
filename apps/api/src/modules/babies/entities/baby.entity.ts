import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { AvatarStyle } from '../../../common/enums/avatar-style.enum';
import { BloodType } from '../../../common/enums/blood-type.enum';
import { Sex } from '../../../common/enums/sex.enum';
import { Family } from '../../families/entities/family.entity';

// Bebê cadastrado pela família. V1 guarda apenas dados de nascimento + alguns
// campos médicos opcionais. Medidas atuais ao longo do tempo (curvas de
// crescimento) e fotos ficam para V2.
@Entity('babies')
export class Baby extends SoftDeletableEntity {
  // Dono — a família que cadastrou. Todos os membros podem ver/editar.
  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => Family, (family) => family.babies, {
    nullable: false,
    onDelete: 'CASCADE',
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

  // -------- Campos médicos opcionais --------
  @Column({ name: 'blood_type', type: 'enum', enum: BloodType, nullable: true })
  bloodType: BloodType | null = null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  allergies: string | null = null;

  @Column({ name: 'eye_color', type: 'varchar', length: 30, nullable: true })
  eyeColor: string | null = null;

  @Column({ type: 'text', nullable: true })
  notes: string | null = null;

  // -------- Avatar (DiceBear) --------
  // Default 'lorelei' por ser estilo cute pra crianças. Pode ser trocado pelo user.
  @Column({
    name: 'avatar_style',
    type: 'enum',
    enum: AvatarStyle,
    default: AvatarStyle.LORELEI,
  })
  avatarStyle: AvatarStyle = AvatarStyle.LORELEI;

  // Default = nome do bebê (UsersService.create faz isso no service)
  @Column({ name: 'avatar_seed', type: 'varchar', length: 100 })
  avatarSeed!: string;
}
