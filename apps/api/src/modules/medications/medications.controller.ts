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
import { maskToDayNames } from '../../common/utils/days-of-week.util';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { CreateMedicationDto } from './dto/create-medication.dto';
import { MedicationResponseDto, MedScheduleResponseDto } from './dto/medication-response.dto';
import { UpdateMedicationDto } from './dto/update-medication.dto';
import { Medication } from './entities/medication.entity';
import { MedSchedule } from './entities/med-schedule.entity';
import { MedicationsService } from './medications.service';

@ApiBearerAuth()
@ApiTags('medications')
@Controller('babies/:babyId/medications')
export class MedicationsController {
  constructor(private readonly medications: MedicationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista remédios do bebê' })
  @ApiResponse({ status: 200, type: [MedicationResponseDto] })
  async list(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
  ): Promise<MedicationResponseDto[]> {
    const list = await this.medications.findAllByBaby(babyId, user.familyId);
    return list.map((m) => this.toResponse(m));
  }

  @Post()
  @ApiOperation({ summary: 'Cadastra um novo remédio' })
  @ApiResponse({ status: 201, type: MedicationResponseDto })
  async create(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Body() dto: CreateMedicationDto,
  ): Promise<MedicationResponseDto> {
    const med = await this.medications.create(babyId, user.familyId, dto);
    // Garante array de schedules vazio (recém-criado, nenhum horário ainda)
    // sem fazer spread que perderia os métodos da classe (assignUuid).
    if (!med.schedules) med.schedules = [];
    return this.toResponse(med);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um remédio (com seus horários)' })
  @ApiResponse({ status: 200, type: MedicationResponseDto })
  async findOne(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MedicationResponseDto> {
    const med = await this.medications.findOne(id, babyId, user.familyId);
    return this.toResponse(med);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados do remédio' })
  @ApiResponse({ status: 200, type: MedicationResponseDto })
  async update(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMedicationDto,
  ): Promise<MedicationResponseDto> {
    const med = await this.medications.update(id, babyId, user.familyId, dto);
    return this.toResponse(med);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete do remédio' })
  async remove(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.medications.remove(id, babyId, user.familyId);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private toResponse(med: Medication): MedicationResponseDto {
    return {
      id: med.id,
      babyId: med.babyId,
      familyId: med.familyId,
      name: med.name,
      dose: med.dose,
      doseUnit: med.doseUnit,
      instructions: med.instructions,
      startDate: med.startDate,
      endDate: med.endDate,
      isActive: med.isActive,
      schedules: (med.schedules ?? []).map((s) => this.toScheduleResponse(s)),
      createdAt: med.createdAt.toISOString(),
      updatedAt: med.updatedAt.toISOString(),
    };
  }

  private toScheduleResponse(s: MedSchedule): MedScheduleResponseDto {
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
