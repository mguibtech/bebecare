import { resolveProductionApiBaseUrl } from './env';

describe('resolveProductionApiBaseUrl', () => {
  it('aceita a URL HTTPS do Railway e remove a barra final', () => {
    expect(
      resolveProductionApiBaseUrl('https://bebecare-api.up.railway.app/api/'),
    ).toBe('https://bebecare-api.up.railway.app/api');
  });

  it.each([
    '',
    'http://bebecare-api.up.railway.app/api',
    'https://bebecare-api.up.railway.app',
    'https://bebecare-api.up.railway.app/api?test=true',
  ])('rejeita configuração de release inválida: %s', (value) => {
    expect(() => resolveProductionApiBaseUrl(value)).toThrow();
  });
});
