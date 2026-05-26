import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Baby } from '../babies/entities/baby.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsMissedJob } from './jobs/appointments-missed.job';
import { AppointmentsReminderJob } from './jobs/appointments-reminder.job';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Baby]), NotificationsModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsMissedJob, AppointmentsReminderJob],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
