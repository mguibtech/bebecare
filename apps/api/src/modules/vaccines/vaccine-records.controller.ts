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
import { Lang } from '../../common/i18n/lang';
import { User } from '../users/entities/user.entity';
import { CreateVaccineRecordDto } from './dto/create-vaccine-record.dto';
import { UpdateVaccineRecordDto } from './dto/update-vaccine-record.dto';
import { VaccineRecordResponseDto } from './dto/vaccine-record-response.dto';
import { translateVaccine } from './i18n/vaccine-translations';
import { VaccineRecord } from './entities/vaccine-record.entity';
import { VaccineRecordsService } from './vaccine-records.service';

@ApiBearerAuth()
@ApiTags('vaccines')
@Controller('babies/:babyId/vaccine-records')
export class VaccineRecordsController {
  constructor(private readonly records: VaccineRecordsService) {}

  @Get()
  @ApiOperation({ summary: 'Histórico de doses aplicadas do bebê' })
  @ApiResponse({ status: 200, type: [VaccineRecordResponseDto] })
  async findAll(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Lang() lang: Lang,
  ): Promise<VaccineRecordResponseDto[]> {
    const records = await this.records.findAllByBaby(babyId, user.familyId);
    return records.map((r) => this.toResponse(r, lang));
  }

  @Post()
  @ApiOperation({ summary: 'Registra que o bebê tomou uma dose' })
  @ApiResponse({ status: 201, type: VaccineRecordResponseDto })
  async create(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Body() dto: CreateVaccineRecordDto,
    @Lang() lang: Lang,
  ): Promise<VaccineRecordResponseDto> {
    const record = await this.records.create(babyId, user.familyId, dto);
    // Recarrega com a vacina populada
    const full = (await this.records.findAllByBaby(babyId, user.familyId)).find(
      (r) => r.id === record.id,
    );
    return this.toResponse(full ?? record, lang);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Corrige info de um registro (data, lote, local, notas)' })
  @ApiResponse({ status: 200, type: VaccineRecordResponseDto })
  async update(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVaccineRecordDto,
    @Lang() lang: Lang,
  ): Promise<VaccineRecordResponseDto> {
    const record = await this.records.update(id, babyId, user.familyId, dto);
    return this.toResponse(record, lang);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove um registro (engano de digitação)' })
  async remove(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.records.remove(id, babyId, user.familyId);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private toResponse(record: VaccineRecord, lang: Lang = 'pt'): VaccineRecordResponseDto {
    const text = record.vaccine
      ? translateVaccine(record.vaccine, lang)
      : { name: '', description: null, doseLabel: '' };
    return {
      id: record.id,
      babyId: record.babyId,
      familyId: record.familyId,
      vaccine: {
        id: record.vaccine?.id ?? record.vaccineId,
        code: record.vaccine?.code ?? '',
        name: text.name,
        description: text.description,
        doseLabel: text.doseLabel,
        doseNumber: record.vaccine?.doseNumber ?? 0,
        isBooster: record.vaccine?.isBooster ?? false,
        recommendedAgeMonths: record.vaccine?.recommendedAgeMonths ?? 0,
        minAgeMonths: record.vaccine?.minAgeMonths ?? 0,
        maxAgeMonths: record.vaccine?.maxAgeMonths ?? null,
        displayOrder: record.vaccine?.displayOrder ?? 0,
      },
      appliedAt: record.appliedAt,
      lotNumber: record.lotNumber,
      location: record.location,
      notes: record.notes,
      createdAt: record.createdAt.toISOString(),
    };
  }
}
