import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfig } from './config/database.config';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { UsersModule } from './modules/users/users.module';
import { FamiliesModule } from './modules/families/families.module';
import { BabiesModule } from './modules/babies/babies.module';
import { RefreshTokensModule } from './modules/refresh-tokens/refresh-tokens.module';
import { VaccinesModule } from './modules/vaccines/vaccines.module';
import { AppointmentsModule } from './modules/appointments/appointments.module';
import { MedicationsModule } from './modules/medications/medications.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

// Módulo raiz da aplicação. A partir daqui, cada feature do BebeCare
// (auth, users, families, babies, vaccines, appointments, medications,
// notifications, etc.) entra como um módulo importado.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: typeOrmConfig,
    }),

    // Habilita @Cron / @Interval / @Timeout em providers
    // (usado pelos jobs de expiração de convites, marcação de consultas
    // perdidas, criação diária de doses, lembretes de push, etc.).
    ScheduleModule.forRoot(),

    RefreshTokensModule,
    AuthModule,
    UsersModule,
    FamiliesModule,
    BabiesModule,
    VaccinesModule,
    AppointmentsModule,
    MedicationsModule,
    NotificationsModule,
    HealthModule,
  ],
  providers: [
    // Guard global — toda rota exige JWT exceto as marcadas com @Public()
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
