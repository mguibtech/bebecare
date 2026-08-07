/**
 * Testes dos schemas de auth (login permissivo, register alinhado com o
 * backend: senha >= 8, convite de 6 dígitos).
 */
import type { z } from 'zod';

import i18n from '@/shared/i18n';

import { makeLoginSchema, makeRegisterSchema } from './auth.schema';

let loginSchema: ReturnType<typeof makeLoginSchema>;
let registerSchema: ReturnType<typeof makeRegisterSchema>;

beforeAll(async () => {
  await i18n.changeLanguage('pt');
  loginSchema = makeLoginSchema(i18n.t);
  registerSchema = makeRegisterSchema(i18n.t);
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

describe('makeLoginSchema', () => {
  it('normaliza o email pra minúsculas', () => {
    const parsed = loginSchema.parse({
      email: 'Mae@Example.COM',
      password: 'x',
    });
    expect(parsed.email).toBe('mae@example.com');
  });

  it('senha de 1 caractere passa — quem valida credencial é o backend', () => {
    expect(
      loginSchema.safeParse({ email: 'a@b.co', password: '1' }).success,
    ).toBe(true);
  });

  it('email vazio e senha vazia caem nos required', () => {
    const r = loginSchema.safeParse({ email: '', password: '' });
    expect(fieldMessage(r, 'email')).toBe(i18n.t('validation.emailRequired'));
    expect(fieldMessage(r, 'password')).toBe(
      i18n.t('validation.passwordRequired'),
    );
  });

  it('email sem formato válido é rejeitado', () => {
    const r = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(fieldMessage(r, 'email')).toBe(i18n.t('validation.emailInvalid'));
  });

  it('email com espaços nas pontas é aparado antes da validação', () => {
    expect(
      loginSchema.parse({ email: '  Mae@Example.COM  ', password: 'x' }).email,
    ).toBe('mae@example.com');
  });
});

describe('makeRegisterSchema', () => {
  const validBase = {
    email: 'pai@example.com',
    name: 'Mguib',
    password: '12345678',
  };

  it('cadastro válido passa e normaliza o email', () => {
    const parsed = registerSchema.parse({
      ...validBase,
      email: ' Pai@Example.com ',
    });
    expect(parsed.email).toBe('pai@example.com');
  });

  it('senha com 7 caracteres é rejeitada; 8 passa', () => {
    const r = registerSchema.safeParse({ ...validBase, password: '1234567' });
    expect(fieldMessage(r, 'password')).toBe(
      i18n.t('validation.passwordMin8'),
    );
    expect(registerSchema.safeParse(validBase).success).toBe(true);
  });

  it('nome com 1 caractere é rejeitado (mínimo 2, após trim)', () => {
    const r = registerSchema.safeParse({ ...validBase, name: ' A ' });
    expect(fieldMessage(r, 'name')).toBe(i18n.t('validation.nameTooShort'));
  });

  describe('inviteCode', () => {
    it('6 dígitos passa; espaços nas pontas são aparados antes do regex', () => {
      expect(
        registerSchema.parse({ ...validBase, inviteCode: '123456' })
          .inviteCode,
      ).toBe('123456');
      expect(
        registerSchema.parse({ ...validBase, inviteCode: ' 123456 ' })
          .inviteCode,
      ).toBe('123456');
    });

    it('vazio ou omitido vira undefined (não é enviado pra API)', () => {
      expect(
        registerSchema.parse({ ...validBase, inviteCode: '' }).inviteCode,
      ).toBeUndefined();
      expect(registerSchema.parse(validBase).inviteCode).toBeUndefined();
    });

    it('5 dígitos, 7 dígitos e letras são rejeitados', () => {
      for (const bad of ['12345', '1234567', 'abc123']) {
        const r = registerSchema.safeParse({ ...validBase, inviteCode: bad });
        expect(fieldMessage(r, 'inviteCode')).toBe(
          i18n.t('validation.inviteCode'),
        );
      }
    });
  });
});
