import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Baby } from '../babies/entities/baby.entity';
import { VaccineRecord } from './entities/vaccine-record.entity';
import { Vaccine } from './entities/vaccine.entity';
import { VaccineRecordsController } from './vaccine-records.controller';
import { VaccineRecordsService } from './vaccine-records.service';
import { VaccinesController } from './vaccines.controller';
import { VaccinesService } from './vaccines.service';

// Catálogo PNI + registros de vacinas aplicadas por bebê.
// Inclui Baby no forFeature porque tanto VaccinesService quanto VaccineRecordsService
// validam que o bebê pertence à família do user.
@Module({
  imports: [TypeOrmModule.forFeature([Vaccine, VaccineRecord, Baby])],
  controllers: [VaccinesController, VaccineRecordsController],
  providers: [VaccinesService, VaccineRecordsService],
  exports: [VaccinesService],
})
export class VaccinesModule {}
