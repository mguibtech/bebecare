import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Lang } from '../../common/i18n/lang';
import { User } from '../users/entities/user.entity';
import { BabyVaccineScheduleDto } from './dto/baby-vaccine-schedule.dto';
import { VaccineCatalogItemDto } from './dto/vaccine-catalog-item.dto';
import { VaccinesService } from './vaccines.service';

@ApiBearerAuth()
@ApiTags('vaccines')
@Controller()
export class VaccinesController {
  constructor(private readonly vaccines: VaccinesService) {}

  // ----- GET /vaccines/catalog — catálogo PNI completo -----
  @Get('vaccines/catalog')
  @ApiOperation({
    summary: 'Catálogo PNI completo (cacheável no mobile — muda raramente)',
  })
  @ApiResponse({ status: 200, type: [VaccineCatalogItemDto] })
  async getCatalog(@Lang() lang: Lang): Promise<VaccineCatalogItemDto[]> {
    return this.vaccines.getCatalog(lang);
  }

  // ----- GET /babies/:babyId/vaccine-schedule -----
  @Get('babies/:babyId/vaccine-schedule')
  @ApiOperation({
    summary: 'Schedule de vacinas do bebê com status calculado (applied/overdue/due/upcoming)',
  })
  @ApiResponse({ status: 200, type: BabyVaccineScheduleDto })
  async getSchedule(
    @CurrentUser() user: User,
    @Param('babyId', ParseUUIDPipe) babyId: string,
    @Lang() lang: Lang,
  ): Promise<BabyVaccineScheduleDto> {
    return this.vaccines.buildScheduleForBaby(babyId, user.familyId, lang);
  }
}
