import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VaccineStatus } from '../../common/enums/vaccine-status.enum';
import { Baby } from '../babies/entities/baby.entity';
import { differenceInMonths, parseISO } from '../babies/utils/age.util';
import { BabyVaccineScheduleDto, ScheduleEntryDto } from './dto/baby-vaccine-schedule.dto';
import { VaccineCatalogItemDto } from './dto/vaccine-catalog-item.dto';
import { VaccineRecord } from './entities/vaccine-record.entity';
import { Vaccine } from './entities/vaccine.entity';

// Tolerância (em meses) após a idade recomendada para considerar OVERDUE.
// Configurado em 6 meses por decisão do produto (alinha conservador).
const OVERDUE_TOLERANCE_MONTHS = 6;

@Injectable()
export class VaccinesService {
  constructor(
    @InjectRepository(Vaccine) private readonly vaccines: Repository<Vaccine>,
    @InjectRepository(VaccineRecord)
    private readonly records: Repository<VaccineRecord>,
    @InjectRepository(Baby) private readonly babies: Repository<Baby>,
  ) {}

  // -------------------------------------------------------------------
  // CATÁLOGO
  // -------------------------------------------------------------------
  async getCatalog(): Promise<VaccineCatalogItemDto[]> {
    const all = await this.vaccines.find({
      where: { isActive: true },
      order: { displayOrder: 'ASC' },
    });
    return all.map((v) => this.toCatalogItem(v));
  }

  // -------------------------------------------------------------------
  // SCHEDULE POR BEBÊ
  // -------------------------------------------------------------------
  async buildScheduleForBaby(babyId: string, familyId: string): Promise<BabyVaccineScheduleDto> {
    const baby = await this.babies.findOne({ where: { id: babyId } });
    if (!baby || baby.familyId !== familyId) {
      throw new NotFoundException('Bebê não encontrado nesta família');
    }

    // Busca catálogo + records do bebê em paralelo
    const [catalog, records] = await Promise.all([
      this.vaccines.find({
        where: { isActive: true },
        order: { displayOrder: 'ASC' },
      }),
      this.records.find({ where: { babyId } }),
    ]);

    const recordByVaccineId = new Map(records.map((r) => [r.vaccineId, r]));

    const birthDate = parseISO(baby.birthDate);
    const today = new Date();
    const ageMonths = differenceInMonths(today, birthDate);

    const entries: ScheduleEntryDto[] = catalog.map((vaccine) => {
      const record = recordByVaccineId.get(vaccine.id);

      const status = this.computeStatus(vaccine, ageMonths, !!record);
      const expectedAt = this.computeExpectedDate(baby.birthDate, vaccine.recommendedAgeMonths);

      return {
        vaccine: this.toCatalogItem(vaccine),
        status,
        appliedAt: record?.appliedAt ?? null,
        recordId: record?.id ?? null,
        expectedAt,
      };
    });

    // Reordena para que o front receba a ordem mais útil:
    // overdue → due → upcoming → applied (e dentro de cada bloco, por displayOrder).
    const statusOrder: Record<VaccineStatus, number> = {
      [VaccineStatus.OVERDUE]: 0,
      [VaccineStatus.DUE]: 1,
      [VaccineStatus.UPCOMING]: 2,
      [VaccineStatus.APPLIED]: 3,
    };
    entries.sort(
      (a, b) =>
        statusOrder[a.status] - statusOrder[b.status] ||
        a.vaccine.displayOrder - b.vaccine.displayOrder,
    );

    // Resumo
    const summary: Record<VaccineStatus, number> = {
      [VaccineStatus.OVERDUE]: 0,
      [VaccineStatus.DUE]: 0,
      [VaccineStatus.UPCOMING]: 0,
      [VaccineStatus.APPLIED]: 0,
    };
    for (const e of entries) summary[e.status] += 1;

    return {
      babyId: baby.id,
      babyName: baby.name,
      babyAgeMonths: ageMonths,
      entries,
      summary,
    };
  }

  // Regras de cálculo de status:
  //  - APPLIED se há record
  //  - UPCOMING se ainda não atingiu minAgeMonths
  //  - OVERDUE se passou recommended + tolerance OU se passou max permitido
  //  - DUE caso esteja dentro da janela
  private computeStatus(
    vaccine: Vaccine,
    babyAgeMonths: number,
    hasRecord: boolean,
  ): VaccineStatus {
    if (hasRecord) return VaccineStatus.APPLIED;
    if (babyAgeMonths < vaccine.minAgeMonths) return VaccineStatus.UPCOMING;

    // Se há max e já passou, OVERDUE
    if (vaccine.maxAgeMonths !== null && babyAgeMonths > vaccine.maxAgeMonths) {
      return VaccineStatus.OVERDUE;
    }

    // Tolerância padrão após o recomendado
    const overdueThreshold = vaccine.recommendedAgeMonths + OVERDUE_TOLERANCE_MONTHS;
    if (babyAgeMonths > overdueThreshold) return VaccineStatus.OVERDUE;

    return VaccineStatus.DUE;
  }

  // Calcula a data esperada (birthDate + recommendedAgeMonths) em 'YYYY-MM-DD'.
  private computeExpectedDate(birthDateISO: string, recommendedAgeMonths: number): string {
    const birth = parseISO(birthDateISO);
    const expected = new Date(birth);
    expected.setUTCMonth(expected.getUTCMonth() + recommendedAgeMonths);
    const yyyy = expected.getUTCFullYear();
    const mm = String(expected.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(expected.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private toCatalogItem(v: Vaccine): VaccineCatalogItemDto {
    return {
      id: v.id,
      code: v.code,
      name: v.name,
      description: v.description,
      doseLabel: v.doseLabel,
      doseNumber: v.doseNumber,
      isBooster: v.isBooster,
      recommendedAgeMonths: v.recommendedAgeMonths,
      minAgeMonths: v.minAgeMonths,
      maxAgeMonths: v.maxAgeMonths,
      displayOrder: v.displayOrder,
    };
  }
}
