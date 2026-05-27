/**
 * Schemas zod para forms de auth.
 * Mensagens em PT-BR direto aqui — sao exibidas ao usuario.
 *
 * Sao MAIS permissivas que o backend de proposito: a UX deve validar
 * cliente-side rapido, e o backend e a fonte da verdade final.
 */

import { z } from 'zod';

/** Regras compartilhadas entre login e register. */
const emailSchema = z
  .string({ required_error: 'Email e obrigatorio' })
  .min(1, 'Email e obrigatorio')
  .email('Email invalido')
  .trim()
  .toLowerCase();

/**
 * Login aceita qualquer senha nao-vazia — quem decide se eh valida e o backend.
 * Evita confundir o usuario com "senha curta" quando a senha do cadastro ja eh longa.
 */
const loginPasswordSchema = z
  .string({ required_error: 'Senha e obrigatoria' })
  .min(1, 'Senha e obrigatoria');

/**
 * Register: minimo 8 caracteres (alinhado com o backend).
 * Backend tambem aceita 8+; manter sincronizado.
 */
const registerPasswordSchema = z
  .string({ required_error: 'Senha e obrigatoria' })
  .min(8, 'Senha precisa ter ao menos 8 caracteres');

const nameSchema = z
  .string({ required_error: 'Nome e obrigatorio' })
  .trim()
  .min(2, 'Nome muito curto')
  .max(120, 'Nome muito longo');

/** Codigo de convite: 6 digitos numericos exatos (formato do backend). */
const inviteCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Codigo deve ter 6 digitos numericos');

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: registerPasswordSchema,
  /** Opcional: deixar string vazia tambem e valido (vira undefined antes do send). */
  inviteCode: z
    .union([inviteCodeSchema, z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
