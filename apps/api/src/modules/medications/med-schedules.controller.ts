import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { maskToDayNames } from '../../common/utils/days-of-week.util';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateMedScheduleDto } from './dto/create-med-schedule.dto';
import { MedScheduleResponseDto } from './dto/medication-response.dto';
import { UpdateMedScheduleDto } from './dto/update-med-schedule.dto';
import { MedSchedule } from './entities/med-schedule.entity';
import { MedSchedulesService } from './med-schedules.service';

@ApiBearerAuth()
@ApiTags('medications')
@Controller('babies/:babyId/medications/:medicationId/schedules')
export class MedSchedulesController {
  constructor(private readonly schedules: MedSchedulesService) {}

  @Post()
  @ApiOperation({ summary: 'Adiciona um horário ao remédio' })
  @ApiResponse({ status: 201, type: MedScheduleResponseDto })
  async create(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('medicationId', ParseUUIDPipe) medicationId: string,
    @Body() dto: CreateMedScheduleDto,
  ): Promise<MedScheduleResponseDto> {
    const schedule = await this.schedules.create(
      medicationId,
      babyId,
      user.familyId,
      dto,
    );
    return this.toResponse(schedule);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um horário' })
  @ApiResponse({ status: 200, type: MedScheduleResponseDto })
  async update(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('medicationId', ParseUUIDPipe) medicationId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedScheduleDto,
  ): Promise<MedScheduleResponseDto> {
    const schedule = await this.schedules.update(
      id,
      medicationId,
      babyId,
      user.familyId,
      dto,
    );
    return this.toResponse(schedule);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um horário' })
  async remove(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('medicationId', ParseUUIDPipe) medicationId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.schedules.remove(id, medicationId, babyId, user.familyId);
  }

  private toResponse(s: MedSchedule): MedScheduleResponseDto {
    return {
      id: s.id,
      time: s.time,
      daysOfWeekMask: s.daysOfWeekMask,
      daysOfWeekNames: maskToDayNames(s.daysOfWeekMask),
      useAlarm: s.useAlarm,
      isActive: s.isActive,
    };
  }
}
