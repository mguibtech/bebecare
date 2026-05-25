import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from './entities/family.entity';
import { FamilyInvite } from './entities/family-invite.entity';
import { FamiliesService } from './families.service';
import { UsersModule } from '../users/users.module';

// Módulo de famílias e convites. Expõe FamiliesService para o AuthModule usar
// no registro (cria família antes de criar user). Controller dos convites
// chega em A3.
@Module({
  imports: [
    TypeOrmModule.forFeature([Family, FamilyInvite]),
    UsersModule, // precisamos do User repository pra resolver os membros
  ],
  providers: [FamiliesService],
  exports: [TypeOrmModule, FamiliesService],
})
export class FamiliesModule {}
