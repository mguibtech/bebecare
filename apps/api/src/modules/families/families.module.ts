import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from './entities/family.entity';
import { FamilyInvite } from './entities/family-invite.entity';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';
import { FamilyInvitesService } from './family-invites.service';
import { FamilyInvitesCleanupJob } from './jobs/family-invites-cleanup.job';
import { UsersModule } from '../users/users.module';

// Módulo de famílias, convites e gestão de membros.
@Module({
  imports: [
    TypeOrmModule.forFeature([Family, FamilyInvite]),
    UsersModule, // precisamos do User repository
  ],
  controllers: [FamiliesController],
  providers: [FamiliesService, FamilyInvitesService, FamilyInvitesCleanupJob],
  exports: [TypeOrmModule, FamiliesService, FamilyInvitesService],
})
export class FamiliesModule {}
