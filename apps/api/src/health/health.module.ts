import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

// Módulo do healthcheck. Não precisa de providers próprios — usa o DataSource
// já registrado pelo TypeOrmModule global.
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
