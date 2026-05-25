import { DeleteDateColumn } from 'typeorm';
import { BaseEntity } from './base.entity';

// Versão da BaseEntity que adiciona suporte a soft delete via `deleted_at`.
// O TypeORM cuida do filtro automaticamente nas queries com EntityManager/Repository
// padrões. Use `withDeleted: true` se precisar incluir os registros excluídos.
export abstract class SoftDeletableEntity extends BaseEntity {
  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt: Date | null = null;
}
