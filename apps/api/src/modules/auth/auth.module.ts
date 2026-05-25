import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyInvite } from '../families/entities/family-invite.entity';
import { FamiliesModule } from '../families/families.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenService } from './refresh-token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    FamiliesModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    // JWT só com access token. Refresh é gerenciado pela própria app (não é JWT).
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // @nestjs/jwt v11 tipa expiresIn como `StringValue` do pacote `ms`
          // (literal type tipo '15m', '1h', '30d'). Como lemos do .env (string
          // genérica), forçamos o tipo aqui — o jsonwebtoken aceita perfeitamente.
          expiresIn: config.get<string>(
            'JWT_ACCESS_EXPIRES_IN',
            '15m',
          ) as unknown as number,
        },
      }),
    }),
    // RefreshToken precisa estar registrada no escopo do módulo
    TypeOrmModule.forFeature([RefreshToken, FamilyInvite]),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
