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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { AlarmsService } from './alarms.service';
import { AlarmResponseDto } from './dto/alarm-response.dto';
import { CreateAlarmDto } from './dto/create-alarm.dto';
import { UpdateAlarmDto } from './dto/update-alarm.dto';
import { Alarm } from './entities/alarm.entity';

@ApiBearerAuth()
@ApiTags('alarms')
@Controller('alarms')
export class AlarmsController {
  constructor(private readonly alarms: AlarmsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista os despertadores do usuário logado' })
  @ApiResponse({ status: 200, type: [AlarmResponseDto] })
  async list(@CurrentUser() user: User): Promise<AlarmResponseDto[]> {
    const list = await this.alarms.findAllForUser(user.id);
    return list.map((a) => this.toResponse(a));
  }

  @Post()
  @ApiOperation({ summary: 'Cria um despertador' })
  @ApiResponse({ status: 201, type: AlarmResponseDto })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateAlarmDto,
  ): Promise<AlarmResponseDto> {
    const alarm = await this.alarms.create(user.id, dto);
    return this.toResponse(alarm);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um despertador' })
  @ApiResponse({ status: 200, type: AlarmResponseDto })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<AlarmResponseDto> {
    const alarm = await this.alarms.findOne(id, user.id);
    return this.toResponse(alarm);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza um despertador' })
  @ApiResponse({ status: 200, type: AlarmResponseDto })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAlarmDto,
  ): Promise<AlarmResponseDto> {
    const alarm = await this.alarms.update(id, user.id, dto);
    return this.toResponse(alarm);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete de um despertador' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.alarms.remove(id, user.id);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private toResponse(a: Alarm): AlarmResponseDto {
    return {
      id: a.id,
      userId: a.userId,
      label: a.label,
      time: a.time,
      daysOfWeekMask: a.daysOfWeekMask,
      category: a.category,
      soundKey: a.soundKey,
      isActive: a.isActive,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }
}
