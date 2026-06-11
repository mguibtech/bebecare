import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Public } from '../modules/auth/decorators/public.decorator';

// Endpoint simples para confirmar que a API está viva e o banco conectado.
// Útil para liveness/readiness em deploys, e para sanity check do dev.
@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async check() {
    let dbStatus: 'up' | 'down' = 'down';
    try {
      // Consulta trivial para validar a conexão
      await this.dataSource.query('SELECT 1');
      dbStatus = 'up';
    } catch {
      dbStatus = 'down';
    }

    const body = {
      status: dbStatus === 'up' ? 'ok' : 'degraded',
      service: 'bebecare-api',
      version: '0.0.1',
      timestamp: new Date().toISOString(),
      db: dbStatus,
    };

    // Banco fora → 503 pra readiness probes (Render/K8s) tratarem como unhealthy.
    // O corpo JSON é preservado (HttpException com objeto serializa o objeto).
    if (dbStatus === 'down') {
      throw new ServiceUnavailableException(body);
    }
    return body;
  }
}
