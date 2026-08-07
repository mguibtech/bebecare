/**
 * Helpers de entrada numérica vinda de TextInput.
 *
 * Em RN todo input chega como string, e no teclado numérico pt-BR o separador
 * decimal é a VÍRGULA. Sem normalizar, "2,5" viraria NaN e o form reprovaria
 * uma dose perfeitamente válida.
 */

/**
 * Converte entrada de campo numérico em `number`.
 *
 * - vazio/null/undefined → `undefined` (campo opcional não preenchido)
 * - aceita vírgula como separador decimal ("2,5" → 2.5)
 * - entrada não numérica é devolvida INTACTA, pra que o zod gere a mensagem de
 *   tipo inválido (invalid_type_error) em vez de um NaN silencioso.
 */
export function parseNumericInput(value: unknown): unknown {
  if (value === null || value === undefined) return undefined;

  if (typeof value === 'string') {
    // Só a primeira vírgula vira ponto: "1,5" → 1.5. Formatação de milhar
    // ("1.234,5") continua inválida de propósito — ambígua num campo livre.
    const normalized = value.trim().replace(',', '.');
    if (normalized === '') return undefined;
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? value : parsed;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}
