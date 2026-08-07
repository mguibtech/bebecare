import type { Lang } from '../../../common/i18n/lang';
import type { Vaccine } from '../entities/vaccine.entity';

/**
 * Traduções do conteúdo do catálogo de vacinas (PNI), por `code`.
 *
 * O seed do banco está em pt (fonte-de-verdade). Aqui só ficam os overrides em
 * inglês — quando `Accept-Language` pede `en`, o serviço troca nome/descrição/
 * doseLabel por estes. Code ausente cai no valor pt do banco (fallback seguro).
 *
 * Manter em sincronia com a migration SeedVaccinesPNI (mesmos `code`s).
 */
export type VaccineText = {
  name: string;
  description: string;
  doseLabel: string;
};

const EN: Record<string, VaccineText> = {
  BCG: {
    name: 'BCG',
    description: 'Prevents severe forms of tuberculosis. Given at the maternity ward.',
    doseLabel: 'Single dose',
  },
  HEPB_BIRTH: {
    name: 'Hepatitis B',
    description: 'First dose of Hepatitis B, given within the first 24h of life.',
    doseLabel: 'At birth',
  },
  PENTA_1: {
    name: 'Pentavalent',
    description:
      'DTP (diphtheria, tetanus, pertussis) + Hib (Haemophilus influenzae B) + Hepatitis B.',
    doseLabel: '1st dose',
  },
  VIP_1: {
    name: 'Polio (IPV)',
    description: 'Inactivated polio vaccine.',
    doseLabel: '1st dose',
  },
  ROTA_1: {
    name: 'Rotavirus',
    description:
      'Prevents severe rotavirus diarrhea. Short window — cannot be started after 3 months and 15 days.',
    doseLabel: '1st dose',
  },
  PCV10_1: {
    name: 'Pneumococcal 10v',
    description: 'Prevents pneumonia, meningitis and other pneumococcal diseases.',
    doseLabel: '1st dose',
  },
  MENC_1: {
    name: 'Meningococcal C',
    description: 'Prevents meningitis and meningococcus C infections.',
    doseLabel: '1st dose',
  },
  PENTA_2: {
    name: 'Pentavalent',
    description: 'Second dose of the pentavalent.',
    doseLabel: '2nd dose',
  },
  VIP_2: {
    name: 'Polio (IPV)',
    description: 'Second dose of inactivated polio.',
    doseLabel: '2nd dose',
  },
  ROTA_2: {
    name: 'Rotavirus',
    description: 'Second dose. Cannot be given after 7 months and 29 days.',
    doseLabel: '2nd dose',
  },
  PCV10_2: {
    name: 'Pneumococcal 10v',
    description: 'Second dose of the pneumococcal.',
    doseLabel: '2nd dose',
  },
  MENC_2: {
    name: 'Meningococcal C',
    description: 'Second dose of meningococcal C.',
    doseLabel: '2nd dose',
  },
  PENTA_3: {
    name: 'Pentavalent',
    description: 'Third and final dose of the pentavalent.',
    doseLabel: '3rd dose',
  },
  VIP_3: {
    name: 'Polio (IPV)',
    description: 'Third dose of inactivated polio.',
    doseLabel: '3rd dose',
  },
  YF_1: {
    name: 'Yellow Fever',
    description: 'Recommended nationwide since 2020.',
    doseLabel: 'Initial dose',
  },
  MMR_1: {
    name: 'MMR',
    description: 'Measles, mumps and rubella (MMR).',
    doseLabel: '1st dose',
  },
  PCV10_BOOSTER: {
    name: 'Pneumococcal 10v',
    description: 'Pneumococcal booster.',
    doseLabel: 'Booster',
  },
  MENC_BOOSTER: {
    name: 'Meningococcal C',
    description: 'Meningococcal booster.',
    doseLabel: 'Booster',
  },
  DTP_BOOSTER_1: {
    name: 'DTP (booster)',
    description: 'First DTP booster (diphtheria, tetanus and pertussis).',
    doseLabel: '1st booster',
  },
  VOP_BOOSTER_1: {
    name: 'Polio (OPV)',
    description: 'Oral polio booster (drops).',
    doseLabel: '1st booster',
  },
  HEPA: {
    name: 'Hepatitis A',
    description: 'Single dose against Hepatitis A.',
    doseLabel: 'Single dose',
  },
  MMR_2: {
    name: 'MMRV',
    description: 'Measles, mumps, rubella and varicella.',
    doseLabel: '2nd dose (with varicella)',
  },
  DTP_BOOSTER_2: {
    name: 'DTP (booster)',
    description: 'Second DTP booster.',
    doseLabel: '2nd booster',
  },
  VOP_BOOSTER_2: {
    name: 'Polio (OPV)',
    description: 'Second oral polio booster.',
    doseLabel: '2nd booster',
  },
  VARICELA_BOOSTER: {
    name: 'Varicella (booster)',
    description: 'Varicella (chickenpox) booster.',
    doseLabel: 'Booster',
  },
  YF_BOOSTER: {
    name: 'Yellow Fever (booster)',
    description: 'Single yellow fever booster.',
    doseLabel: 'Booster',
  },
};

export type VaccineFields = Pick<Vaccine, 'name' | 'description' | 'doseLabel'>;

/**
 * Retorna nome/descrição/doseLabel no idioma pedido. `en` usa o override (se o
 * code existir); qualquer outro caso devolve os valores pt do próprio registro.
 */
export function translateVaccine(v: Vaccine, lang: Lang): VaccineFields {
  if (lang === 'en') {
    const t = EN[v.code];
    if (t) {
      return { name: t.name, description: t.description, doseLabel: t.doseLabel };
    }
  }
  return { name: v.name, description: v.description, doseLabel: v.doseLabel };
}
