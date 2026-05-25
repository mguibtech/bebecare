import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Baby } from '../babies/entities/baby.entity';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsMissedJob } from './jobs/appointments-missed.job';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Baby])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsMissedJob],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
