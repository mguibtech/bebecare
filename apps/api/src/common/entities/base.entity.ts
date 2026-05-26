import { BeforeInsert, CreateDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { generateUuidV7 } from '../utils/uuid.util';

// Entidade base para tudo que tem ID UUID v7 + timestamps de auditoria.
// Não inclui soft delete — para isso, usar SoftDeletableEntity.
export abstract class BaseEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  updatedAt!: Date;

  // Atribui o UUID v7 antes do insert, caso ainda não tenha sido definido manualmente.
  @BeforeInsert()
  protected assignUuid(): void {
    if (!this.id) {
      this.id = generateUuidV7();
    }
  }
}
