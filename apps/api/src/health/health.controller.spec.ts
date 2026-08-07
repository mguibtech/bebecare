import { ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

function makeController(queryImpl: () => Promise<unknown>): HealthController {
  const ds = { query: jest.fn(queryImpl) } as unknown as DataSource;
  return new HealthController(ds);
}

describe('HealthController', () => {
  it('retorna ok (200) quando o banco responde', async () => {
    const controller = makeController(() => Promise.resolve([{ ok: 1 }]));
    const res = await controller.check();
    expect(res.status).toBe('ok');
    expect(res.db).toBe('up');
    expect(res.service).toBe('bebecare-api');
  });

  it('lança ServiceUnavailable (503) quando o banco cai', async () => {
    const controller = makeController(() => Promise.reject(new Error('down')));
    await expect(controller.check()).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('o corpo do 503 preserva o status degraded + db down', async () => {
    const controller = makeController(() => Promise.reject(new Error('down')));
    try {
      await controller.check();
      fail('deveria ter lançado');
    } catch (err) {
      const body = (err as ServiceUnavailableException).getResponse() as {
        status: string;
        db: string;
      };
      expect(body.status).toBe('degraded');
      expect(body.db).toBe('down');
    }
  });
});
