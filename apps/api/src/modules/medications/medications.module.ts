import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Baby } from '../babies/entities/baby.entity';
import { MedDoseLogsController } from './med-dose-logs.controller';
import { MedDoseLogsService } from './med-dose-logs.service';
import { MedSchedulesController } from './med-schedules.controller';
import { MedSchedulesService } from './med-schedules.service';
import { MedicationsController } from './medications.controller';
import { MedicationsService } from './medications.service';
import { MedDoseLog } from './entities/med-dose-log.entity';
import { MedSchedule } from './entities/med-schedule.entity';
import { Medication } from './entities/medication.entity';
import { CreateDailyDoseLogsJob } from './jobs/create-daily-dose-logs.job';

@Module({
  imports: [
    TypeOrmModule.forFeature([Medication, MedSchedule, MedDoseLog, Baby]),
  ],
  controllers: [
    MedicationsController,
    MedSchedulesController,
    MedDoseLogsController,
  ],
  providers: [
    MedicationsService,
    MedSchedulesService,
    MedDoseLogsService,
    CreateDailyDoseLogsJob,
  ],
  exports: [MedicationsService, MedSchedulesService, MedDoseLogsService],
})
export class MedicationsModule {}
