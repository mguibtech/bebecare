import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

// Módulo de usuários. Registra a entidade, expõe o repositório (TypeOrmModule)
// e o UsersService para que outros módulos (auth, families) os usem.
// Controller virá em A4 (quando o usuário pode editar próprio perfil/avatar).
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
