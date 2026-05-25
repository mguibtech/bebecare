import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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
import { DoseLogFilterDto } from './dto/dose-log-filter.dto';
import { DoseLogResponseDto } from './dto/dose-log-response.dto';
import { SkipDoseDto } from './dto/skip-dose.dto';
import { MedDoseLog } from './entities/med-dose-log.entity';
import { MedDoseLogsService } from './med-dose-logs.service';

@ApiBearerAuth()
@ApiTags('medications')
@Controller('babies/:babyId/doses')
export class MedDoseLogsController {
  constructor(private readonly doses: MedDoseLogsService) {}

  // ----- GET /babies/:babyId/doses/today -----
  @Get('today')
  @ApiOperation({ summary: 'Doses esperadas para hoje (cron cria PENDING à meia-noite)' })
  @ApiResponse({ status: 200, type: [DoseLogResponseDto] })
  async today(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
  ): Promise<DoseLogResponseDto[]> {
    const logs = await this.doses.findToday(babyId, user.familyId);
    return logs.map((l) => this.toResponse(l));
  }

  // ----- GET /babies/:babyId/doses (histórico com filtros) -----
  @Get()
  @ApiOperation({ summary: 'Histórico de doses (até 200 mais recentes)' })
  @ApiResponse({ status: 200, type: [DoseLogResponseDto] })
  async history(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Query() filter: DoseLogFilterDto,
  ): Promise<DoseLogResponseDto[]> {
    const logs = await this.doses.findHistory(babyId, user.familyId, filter);
    return logs.map((l) => this.toResponse(l));
  }

  // ----- POST /babies/:babyId/doses/:id/take -----
  @Post(':id/take')
  @ApiOperation({ summary: 'Marca a dose como tomada' })
  @ApiResponse({ status: 200, type: DoseLogResponseDto })
  async take(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DoseLogResponseDto> {
    const log = await this.doses.take(id, babyId, user.familyId, user.id);
    return this.toResponse(log);
  }

  // ----- POST /babies/:babyId/doses/:id/skip -----
  @Post(':id/skip')
  @ApiOperation({ summary: 'Marca a dose como pulada (com motivo opcional)' })
  @ApiResponse({ status: 200, type: DoseLogResponseDto })
  async skip(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SkipDoseDto,
  ): Promise<DoseLogResponseDto> {
    const log = await this.doses.skip(id, babyId, user.familyId, user.id, dto);
    return this.toResponse(log);
  }

  // ----- POST /babies/:babyId/doses/:id/reset (engano) -----
  @Post(':id/reset')
  @ApiOperation({ summary: 'Volta a dose para PENDING (correção de engano)' })
  @ApiResponse({ status: 200, type: DoseLogResponseDto })
  async reset(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DoseLogResponseDto> {
    const log = await this.doses.resetToPending(id, babyId, user.familyId, user.id);
    return this.toResponse(log);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private toResponse(log: MedDoseLog): DoseLogResponseDto {
    return {
      id: log.id,
      babyId: log.babyId,
      familyId: log.familyId,
      scheduleId: log.scheduleId,
      medication: {
        id: log.medicationId,
        name: log.medication?.name ?? '',
        dose: log.medication?.dose ?? '',
        doseUnit: log.medication?.doseUnit ?? ('drop' as any),
        instructions: log.medication?.instructions ?? null,
      },
      scheduledFor: log.scheduledFor.toISOString(),
      status: log.status,
      takenAt: log.takenAt?.toISOString() ?? null,
      skipReason: log.skipReason,
      loggedByUserId: log.loggedByUserId,
      loggedByName: log.loggedByUser?.name ?? null,
    };
  }
}
