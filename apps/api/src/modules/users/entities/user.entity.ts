import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { AvatarStyle } from '../../../common/enums/avatar-style.enum';
import { Family } from '../../families/entities/family.entity';

// Usuário do BebeCare. Todo usuário pertence a uma e somente uma família —
// mesmo solo, recebe uma família própria criada no momento do cadastro.
// Quando aceita um convite, é movido para a família do convite.
@Entity('users')
export class User extends SoftDeletableEntity {
  // Identidade
  @Index('IDX_users_email_unique', { unique: true, where: '"deleted_at" IS NULL' })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 120 })
  name!: string;

  // Hash da senha (bcrypt). Marcado com select: false para nunca vazar em queries
  // que devolvem o usuário. Para login, o repositório usa addSelect('user.passwordHash').
  @Column({ name: 'password_hash', type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  // Push notifications (FCM) — registrado/atualizado pelo mobile no login.
  @Column({ name: 'fcm_token', type: 'varchar', length: 255, nullable: true })
  fcmToken: string | null = null;

  // Avatar DiceBear. URL é montada no mobile: https://api.dicebear.com/9.x/<style>/svg?seed=<seed>
  @Column({
    name: 'avatar_style',
    type: 'enum',
    enum: AvatarStyle,
    default: AvatarStyle.ADVENTURER,
  })
  avatarStyle: AvatarStyle = AvatarStyle.ADVENTURER;

  // Default é a parte antes do @ no email (ajustado no UsersService no create).
  @Column({ name: 'avatar_seed', type: 'varchar', length: 100 })
  avatarSeed!: string;

  // Relação com a família — sempre NOT NULL. O AuthService cria a family antes do user no register.
  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => Family, (family) => family.members, {
    nullable: false,
    onDelete: 'RESTRICT', // não deixa apagar a family enquanto tiver members
  })
  @JoinColumn({ name: 'family_id' })
  family!: Family;
}
