import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenService } from './refresh-tokens.service';

// Módulo isolado para gestão de refresh tokens. Mantido separado do AuthModule
// para evitar dependências circulares quando o UsersController precisa
// invalidar sessões ao excluir conta.
@Module({
  imports: [TypeOrmModule.forFeature([RefreshToken])],
  providers: [RefreshTokenService],
  exports: [RefreshTokenService, TypeOrmModule],
})
export class RefreshTokensModule {}
