/**
 * Schemas zod para forms de auth.
 * Mensagens em PT-BR direto aqui — são exibidas ao usuário.
 *
 * Sao MAIS permissivas que o backend de proposito: a UX deve validar
 * cliente-side rapido, e o backend e a fonte da verdade final.
 */

import { z } from 'zod';

/** Regras compartilhadas entre login e register. */
const emailSchema = z
  .string({ required_error: 'Email e obrigatório' })
  .min(1, 'Email e obrigatório')
  .email('Email inválido')
  .trim()
  .toLowerCase();

/**
 * Login aceita qualquer senha não-vazia — quem decide se eh valida e o backend.
 * Evita confundir o usuário com "senha curta" quando a senha do cadastro já eh longa.
 */
const loginPasswordSchema = z
  .string({ required_error: 'Senha e obrigatória' })
  .min(1, 'Senha e obrigatória');

/**
 * Register: mínimo 8 caracteres (alinhado com o backend).
 * Backend também aceita 8+; manter sincronizado.
 */
const registerPasswordSchema = z
  .string({ required_error: 'Senha e obrigatória' })
  .min(8, 'Senha precisa ter ao menos 8 caracteres');

const nameSchema = z
  .string({ required_error: 'Nome e obrigatório' })
  .trim()
  .min(2, 'Nome muito curto')
  .max(120, 'Nome muito longo');

/** Código de convite: 6 digitos numericos exatos (formato do backend). */
const inviteCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Código deve ter 6 digitos numericos');

export const loginSchema = z.object({
  email: emailSchema,
  password: loginPasswordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  name: nameSchema,
  password: registerPasswordSchema,
  /** Opcional: deixar string vazia também e valido (vira undefined antes do send). */
  inviteCode: z
    .union([inviteCodeSchema, z.literal('')])
    .optional()
    .transform((v) => (v === '' ? undefined : v)),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
