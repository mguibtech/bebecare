import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

// Armazena APENAS o hash sha256 do refresh token. O token plain text só
// existe em memória durante a resposta da API — se o DB vazar, ninguém
// consegue usar os tokens.
//
// Rotação: cada vez que o cliente troca refresh por novo access, este
// token é revogado e um novo é emitido, ligado via replacedById. Detecta
// uso de refresh roubado: se chegar um refresh já revogado, suspeitar
// e revogar todos os refresh do user.
@Entity('refresh_tokens')
export class RefreshToken extends BaseEntity {
  // sha256 do token plain text (64 chars hex)
  @Index('IDX_refresh_tokens_token_hash_unique', { unique: true })
  @Column({ name: 'token_hash', type: 'varchar', length: 64 })
  tokenHash!: string;

  // Dono do refresh
  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @Column({ name: 'expires_at', type: 'timestamptz' })
  expiresAt!: Date;

  // Preenchido quando o token é revogado (rotação, logout, ou comprometimento)
  @Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
  revokedAt: Date | null = null;

  // Se foi revogado por rotação, este aponta para o novo token que substitui.
  // Permite reconstruir a cadeia em auditorias.
  @Column({ name: 'replaced_by_id', type: 'uuid', nullable: true })
  replacedById: string | null = null;

  // Metadata opcional pra audit/security (ex.: detectar refresh vindo de IP novo)
  @Column({ name: 'created_by_ip', type: 'varchar', length: 64, nullable: true })
  createdByIp: string | null = null;

  @Column({ name: 'user_agent', type: 'varchar', length: 255, nullable: true })
  userAgent: string | null = null;
}
