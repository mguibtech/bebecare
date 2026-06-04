import { extractErrorMessage } from './errors';

describe('extractErrorMessage', () => {
  it('usa a string message do payload', () => {
    expect(
      extractErrorMessage({ statusCode: 401, message: 'Credenciais inválidas' }),
    ).toBe('Credenciais inválidas');
  });

  it('junta message[] de validacao com ", "', () => {
    expect(
      extractErrorMessage({
        statusCode: 400,
        message: ['email inválido', 'senha curta'],
      }),
    ).toBe('email inválido, senha curta');
  });

  it('sem payload, cai no fallback (ex.: error.message do axios)', () => {
    expect(extractErrorMessage(undefined, 'Network Error')).toBe(
      'Network Error',
    );
  });

  it('sem payload nem fallback, mensagem generica de conexao', () => {
    expect(extractErrorMessage(undefined)).toBe('Erro de conexão');
  });

  it('payload sem message usa o fallback', () => {
    expect(
      extractErrorMessage({ statusCode: 500 } as never, 'Falhou'),
    ).toBe('Falhou');
  });
});
