import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Baby } from '../babies/entities/baby.entity';
import { Family } from '../families/entities/family.entity';
import { RefreshTokensModule } from '../refresh-tokens/refresh-tokens.module';
import { User } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// Módulo de usuários. Inclui Family e Baby no TypeOrmModule.forFeature porque
// o `deleteAccount` precisa fazer soft-delete cascateado deles na mesma
// transação. O RefreshTokensModule vem como dependência só pra o controller
// poder revogar sessões ao excluir conta.
@Module({
  imports: [TypeOrmModule.forFeature([User, Family, Baby]), RefreshTokensModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
