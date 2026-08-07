/**
 * Testes do schema do form de consulta (título, data ISO, lembrete restrito
 * às opções oferecidas: 30, 60, 180, 1440, 10080 minutos).
 */
import type { z } from 'zod';

import i18n from '@/shared/i18n';

import { REMINDER_OPTIONS } from '../types';
import { makeAppointmentSchema } from './appointment.schema';

let schema: ReturnType<typeof makeAppointmentSchema>;

beforeAll(async () => {
  await i18n.changeLanguage('pt');
  schema = makeAppointmentSchema(i18n.t);
});

/** Mensagem do primeiro issue de um campo específico (undefined se passou). */
function fieldMessage<I, O>(
  result: z.SafeParseReturnType<I, O>,
  field: string,
): string | undefined {
  return result.success
    ? undefined
    : result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

const validBase = {
  title: 'Pediatra — 9 meses',
  scheduledAt: '2026-08-20T14:30:00.000Z',
};

describe('makeAppointmentSchema — título', () => {
  it('obrigatório (só espaços conta como vazio)', () => {
    const r = schema.safeParse({ ...validBase, title: '   ' });
    expect(fieldMessage(r, 'title')).toBe(i18n.t('validation.titleRequired'));
  });

  it('121 chars estoura', () => {
    const r = schema.safeParse({ ...validBase, title: 'a'.repeat(121) });
    expect(fieldMessage(r, 'title')).toBe(i18n.t('validation.titleTooLong'));
  });
});

describe('makeAppointmentSchema — scheduledAt', () => {
  it('aceita ISO completo com timezone e também o prefixo YYYY-MM-DDTHH:mm', () => {
    expect(schema.safeParse(validBase).success).toBe(true);
    expect(
      schema.safeParse({ ...validBase, scheduledAt: '2026-08-20T14:30' })
        .success,
    ).toBe(true);
  });

  it('vazio cai no required', () => {
    const r = schema.safeParse({ ...validBase, scheduledAt: '' });
    expect(fieldMessage(r, 'scheduledAt')).toBe(
      i18n.t('validation.dateTimeRequired'),
    );
  });

  it('formato brasileiro é rejeitado', () => {
    const r = schema.safeParse({
      ...validBase,
      scheduledAt: '20/08/2026 14:30',
    });
    expect(fieldMessage(r, 'scheduledAt')).toBe(
      i18n.t('validation.dateTimeInvalid'),
    );
  });

  it('data sem hora é rejeitada (precisa do "T")', () => {
    const r = schema.safeParse({ ...validBase, scheduledAt: '2026-08-20' });
    expect(fieldMessage(r, 'scheduledAt')).toBe(
      i18n.t('validation.dateTimeInvalid'),
    );
  });
});

describe('makeAppointmentSchema — lembrete', () => {
  it('defaults: habilitado, 1 dia antes (1440)', () => {
    const parsed = schema.parse(validBase);
    expect(parsed.reminderEnabled).toBe(true);
    expect(parsed.reminderMinutesBefore).toBe(1440);
  });

  it.each(REMINDER_OPTIONS.map((o) => o.value))(
    'aceita a opção oferecida %d',
    (minutes) => {
      expect(
        schema.safeParse({ ...validBase, reminderMinutesBefore: minutes })
          .success,
      ).toBe(true);
    },
  );

  it('minutos fora das opções são rejeitados (45 não está na lista)', () => {
    const r = schema.safeParse({ ...validBase, reminderMinutesBefore: 45 });
    expect(fieldMessage(r, 'reminderMinutesBefore')).toBe(
      i18n.t('validation.reminderInvalid'),
    );
  });
});

describe('makeAppointmentSchema — opcionais', () => {
  it('strings vazias viram undefined', () => {
    const parsed = schema.parse({
      ...validBase,
      doctorName: '',
      specialty: '',
      location: '',
      notes: '',
    });

    expect(parsed.doctorName).toBeUndefined();
    expect(parsed.specialty).toBeUndefined();
    expect(parsed.location).toBeUndefined();
    expect(parsed.notes).toBeUndefined();
  });

  it('limites de tamanho: especialidade 80, local 200', () => {
    expect(
      fieldMessage(
        schema.safeParse({ ...validBase, specialty: 'a'.repeat(81) }),
        'specialty',
      ),
    ).toBe(i18n.t('validation.specialtyTooLong'));
    expect(
      fieldMessage(
        schema.safeParse({ ...validBase, location: 'a'.repeat(201) }),
        'location',
      ),
    ).toBe(i18n.t('validation.locationTooLong'));
  });
});
