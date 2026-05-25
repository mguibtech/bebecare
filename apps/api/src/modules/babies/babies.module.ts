import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Baby } from './entities/baby.entity';

// Módulo de bebês. Por enquanto apenas registra a entidade.
// Service e Controller virão no bloco A4.
@Module({
  imports: [TypeOrmModule.forFeature([Baby])],
  exports: [TypeOrmModule],
})
export class BabiesModule {}
