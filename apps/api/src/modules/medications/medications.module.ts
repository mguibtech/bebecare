import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Baby } from '../babies/entities/baby.entity';
import { NotificationsModule } from '../notifications/notifications.module';
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
import { MedDoseAlarmsJob } from './jobs/med-dose-alarms.job';

@Module({
  imports: [TypeOrmModule.forFeature([Medication, MedSchedule, MedDoseLog, Baby]), NotificationsModule],
  controllers: [MedicationsController, MedSchedulesController, MedDoseLogsController],
  providers: [
    MedicationsService,
    MedSchedulesService,
    MedDoseLogsService,
    CreateDailyDoseLogsJob,
    MedDoseAlarmsJob,
  ],
  exports: [MedicationsService, MedSchedulesService, MedDoseLogsService],
})
export class MedicationsModule {}
