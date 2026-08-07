import { resolveCorsOptions } from './cors.config';

describe('resolveCorsOptions', () => {
  it('mantém CORS aberto em desenvolvimento', () => {
    expect(resolveCorsOptions({ NODE_ENV: 'development' })).toEqual({
      origin: true,
      credentials: true,
    });
  });

  it('não libera origens web em produção sem allowlist explícita', () => {
    expect(resolveCorsOptions({ NODE_ENV: 'production' })).toEqual({
      origin: false,
    });
  });

  it('normaliza e remove origens repetidas da allowlist de produção', () => {
    expect(
      resolveCorsOptions({
        NODE_ENV: 'production',
        CORS_ALLOWED_ORIGINS:
          ' https://admin.bebecare.app,https://admin.bebecare.app , https://site.bebecare.app ',
      }),
    ).toEqual({
      origin: ['https://admin.bebecare.app', 'https://site.bebecare.app'],
      credentials: true,
      maxAge: 86_400,
    });
  });
});
