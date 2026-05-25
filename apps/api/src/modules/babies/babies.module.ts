import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BabiesController } from './babies.controller';
import { BabiesService } from './babies.service';
import { Baby } from './entities/baby.entity';

// Módulo de bebês. CRUD restrito à família do user autenticado.
@Module({
  imports: [TypeOrmModule.forFeature([Baby])],
  controllers: [BabiesController],
  providers: [BabiesService],
  exports: [TypeOrmModule, BabiesService],
})
export class BabiesModule {}
