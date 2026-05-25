import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentFilterDto } from './dto/appointment-filter.dto';
import { AppointmentResponseDto } from './dto/appointment-response.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { CompleteAppointmentDto } from './dto/complete-appointment.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';

@ApiBearerAuth()
@ApiTags('appointments')
@Controller('babies/:babyId/appointments')
export class AppointmentsController {
  constructor(private readonly appointments: AppointmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista consultas com filtros (status, scope, from, to)' })
  @ApiResponse({ status: 200, type: [AppointmentResponseDto] })
  async list(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Query() filter: AppointmentFilterDto,
  ): Promise<AppointmentResponseDto[]> {
    const list = await this.appointments.findByBaby(babyId, user.familyId, filter);
    return list.map((a) => this.toResponse(a));
  }

  @Post()
  @ApiOperation({ summary: 'Cria uma nova consulta' })
  @ApiResponse({ status: 201, type: AppointmentResponseDto })
  async create(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Body() dto: CreateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appt = await this.appointments.create(babyId, user.familyId, dto);
    return this.toResponse(appt);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de uma consulta' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  async findOne(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AppointmentResponseDto> {
    const appt = await this.appointments.findOne(id, babyId, user.familyId);
    return this.toResponse(appt);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza campos editáveis (não muda status)' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  async update(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appt = await this.appointments.update(id, babyId, user.familyId, dto);
    return this.toResponse(appt);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca como realizada e salva observações pós-consulta' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  async complete(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appt = await this.appointments.complete(id, babyId, user.familyId, dto);
    return this.toResponse(appt);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancela com motivo opcional' })
  @ApiResponse({ status: 200, type: AppointmentResponseDto })
  async cancel(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelAppointmentDto,
  ): Promise<AppointmentResponseDto> {
    const appt = await this.appointments.cancel(id, babyId, user.familyId, dto);
    return this.toResponse(appt);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete da consulta' })
  async remove(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.appointments.remove(id, babyId, user.familyId);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private toResponse(a: Appointment): AppointmentResponseDto {
    return {
      id: a.id,
      babyId: a.babyId,
      familyId: a.familyId,
      title: a.title,
      doctorName: a.doctorName,
      specialty: a.specialty,
      scheduledAt: a.scheduledAt.toISOString(),
      location: a.location,
      notes: a.notes,
      status: a.status,
      reminderEnabled: a.reminderEnabled,
      reminderMinutesBefore: a.reminderMinutesBefore,
      completedAt: a.completedAt?.toISOString() ?? null,
      completedNotes: a.completedNotes,
      canceledAt: a.canceledAt?.toISOString() ?? null,
      cancelReason: a.cancelReason,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }
}
