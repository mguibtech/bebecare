import { Column, Entity, OneToMany } from 'typeorm';
import { SoftDeletableEntity } from '../../../common/entities/soft-deletable.entity';
import { User } from '../../users/entities/user.entity';
import { Baby } from '../../babies/entities/baby.entity';
import { FamilyInvite } from './family-invite.entity';

// Representa a "família" (unidade de cuidado do bebê) — pode começar com
// 1 usuário sozinho (mãe/pai solo, avó cuidando, etc.) e crescer via convite.
// É a entidade dona dos bebês: tudo que pertence ao núcleo familiar
// referencia o family_id, não o user_id, para que todos os cuidadores
// vejam os mesmos dados.
@Entity('families')
export class Family extends SoftDeletableEntity {
  // Nome opcional do núcleo familiar (ex.: "Família Silva"). Sem isso,
  // o app mostra os nomes dos membros no header.
  @Column({ type: 'varchar', length: 100, nullable: true })
  name: string | null = null;

  // 1 ou N usuários (V1 enforça limite no service de convites, padrão até 4).
  @OneToMany(() => User, (user) => user.family)
  members!: User[];

  // Todos os bebês cadastrados pela família.
  @OneToMany(() => Baby, (baby) => baby.family)
  babies!: Baby[];

  // Convites enviados (de qualquer status).
  @OneToMany(() => FamilyInvite, (invite) => invite.family)
  invites!: FamilyInvite[];
}
