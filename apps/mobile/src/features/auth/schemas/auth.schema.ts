/**
 * Schemas zod para forms de auth (factories — recebem `t` pra mensagens i18n).
 * As telas montam o schema com `useMemo(() => makeXSchema(t), [t])`.
 *
 * Sao MAIS permissivas que o backend de proposito: a UX deve validar
 * cliente-side rapido, e o backend e a fonte da verdade final.
 */

import { z } from 'zod';
import type { TFunction } from 'i18next';

export function makeLoginSchema(t: TFunction) {
  return z.object({
    email: z
      .string({ required_error: t('validation.emailRequired') })
      .min(1, t('validation.emailRequired'))
      .email(t('validation.emailInvalid'))
      .trim()
      .toLowerCase(),
    // Login aceita qualquer senha não-vazia — quem decide se é válida é o backend.
    password: z
      .string({ required_error: t('validation.passwordRequired') })
      .min(1, t('validation.passwordRequired')),
  });
}

export function makeRegisterSchema(t: TFunction) {
  return z.object({
    email: z
      .string({ required_error: t('validation.emailRequired') })
      .min(1, t('validation.emailRequired'))
      .email(t('validation.emailInvalid'))
      .trim()
      .toLowerCase(),
    name: z
      .string({ required_error: t('validation.nameRequired') })
      .trim()
      .min(2, t('validation.nameTooShort'))
      .max(120, t('validation.nameTooLong')),
    // Register: mínimo 8 caracteres (alinhado com o backend).
    password: z
      .string({ required_error: t('validation.passwordRequired') })
      .min(8, t('validation.passwordMin8')),
    /** Opcional: string vazia também é válida (vira undefined antes do send). */
    inviteCode: z
      .union([
        z
          .string()
          .trim()
          .regex(/^\d{6}$/, t('validation.inviteCode')),
        z.literal(''),
      ])
      .optional()
      .transform((v) => (v === '' ? undefined : v)),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof makeLoginSchema>>;
export type RegisterFormValues = z.infer<ReturnType<typeof makeRegisterSchema>>;
