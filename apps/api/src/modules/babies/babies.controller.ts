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
import { differenceInCalendarDays, differenceInMonths, parseISO } from './utils/age.util';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { BabiesService } from './babies.service';
import { CreateBabyDto } from './dto/create-baby.dto';
import { UpdateBabyDto } from './dto/update-baby.dto';
import { BabyResponseDto } from './dto/baby-response.dto';
import { Baby } from './entities/baby.entity';

@ApiBearerAuth()
@ApiTags('babies')
@Controller('babies')
export class BabiesController {
  constructor(private readonly babies: BabiesService) {}

  // ----- POST /babies -----
  @Post()
  @ApiOperation({ summary: 'Cadastra um bebê na família atual' })
  @ApiResponse({ status: 201, type: BabyResponseDto })
  async create(@CurrentUser() user: User, @Body() dto: CreateBabyDto): Promise<BabyResponseDto> {
    const baby = await this.babies.create(user.familyId, dto);
    return this.toResponse(baby);
  }

  // ----- GET /babies -----
  @Get()
  @ApiOperation({ summary: 'Lista os bebês da família' })
  @ApiResponse({ status: 200, type: [BabyResponseDto] })
  async findAll(@CurrentUser() user: User): Promise<BabyResponseDto[]> {
    const babies = await this.babies.findAllByFamily(user.familyId);
    return babies.map((b) => this.toResponse(b));
  }

  // ----- GET /babies/:id -----
  @Get(':id')
  @ApiOperation({ summary: 'Detalhe de um bebê (precisa pertencer à família)' })
  @ApiResponse({ status: 200, type: BabyResponseDto })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BabyResponseDto> {
    const baby = await this.babies.findOneByFamily(id, user.familyId);
    return this.toResponse(baby);
  }

  // ----- PATCH /babies/:id -----
  @Patch(':id')
  @ApiOperation({ summary: 'Atualiza dados do bebê (campos parciais)' })
  @ApiResponse({ status: 200, type: BabyResponseDto })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBabyDto,
  ): Promise<BabyResponseDto> {
    const baby = await this.babies.update(id, user.familyId, dto);
    return this.toResponse(baby);
  }

  // ----- DELETE /babies/:id -----
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft-delete do bebê (pode ser recuperado em até 30 dias)' })
  async remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.babies.remove(id, user.familyId);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private toResponse(baby: Baby): BabyResponseDto {
    const birth = parseISO(baby.birthDate);
    const now = new Date();
    return {
      id: baby.id,
      familyId: baby.familyId,
      name: baby.name,
      sex: baby.sex,
      birthDate: baby.birthDate,
      ageMonths: differenceInMonths(now, birth),
      ageDays: differenceInCalendarDays(now, birth),
      birthWeightGrams: baby.birthWeightGrams,
      birthHeightCm: baby.birthHeightCm,
      bloodType: baby.bloodType,
      allergies: baby.allergies,
      eyeColor: baby.eyeColor,
      notes: baby.notes,
      avatarStyle: baby.avatarStyle,
      avatarSeed: baby.avatarSeed,
      createdAt: baby.createdAt.toISOString(),
      updatedAt: baby.updatedAt.toISOString(),
    };
  }
}
