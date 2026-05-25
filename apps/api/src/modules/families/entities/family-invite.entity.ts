import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { FamilyInviteStatus } from '../../../common/enums/family-invite-status.enum';
import { User } from '../../users/entities/user.entity';
import { Family } from './family.entity';

// Convite para entrar na família. Hard delete (sem soft delete) porque é
// efêmero e a quantidade pode crescer sem trazer valor histórico relevante.
// Um job diário expira os PENDING vencidos (status -> EXPIRED) e remove os
// muito antigos para manter a tabela enxuta.
@Entity('family_invites')
export class FamilyInvite extends BaseEntity {
  // Código numérico de 6 dígitos. Unicidade só entre os PENDING — após expirar,
  // o mesmo código pode ser reaproveitado.
  @Index('IDX_family_invites_code_pending_unique', {
    unique: true,
    where: "status = 'pending'",
  })
  @Column({ type: 'varchar', length: 6 })
  code!: string;

  @Column({ name: 'family_id', type: 'uuid' })
  familyId!: string;

  @ManyToOne(() => Family, (family) => family.invites, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'family_id' })
  family!: Family;

  // Quem gerou o convite (deve pertencer à família)
  @Column({ name: 'created_by_user_id', type: 'uuid' })
  createdByUserId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser!: User;

  @Column({
    type: 'enum',
    enum: FamilyInviteStatus,
    default: FamilyInviteStatus.PENDING,
  })
  status: FamilyInviteStatus = FamilyInviteStatus.PENDING;

  // 7 dias após a criação por padrão (o service define).
  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  // Preenchidos quando o convite é aceito.
  @Column({ name: 'accepted_by_user_id', type: 'uuid', nullable: true })
  acceptedByUserId: string | null = null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'accepted_by_user_id' })
  acceptedByUser: User | null = null;

  @Column({ name: 'accepted_at', type: 'timestamptz', nullable: true })
  acceptedAt: Date | null = null;
}
