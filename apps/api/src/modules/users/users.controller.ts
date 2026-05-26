import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserPublicDto } from '../auth/dto/auth-response.dto';
import { RefreshTokenService } from '../refresh-tokens/refresh-tokens.service';
import { UpdateFcmTokenDto } from './dto/update-fcm-token.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiBearerAuth()
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly refreshTokens: RefreshTokenService,
  ) {}

  // ----- GET /users/me — perfil do usuário (atalho rápido sem family) -----
  @Get('me')
  @ApiOperation({ summary: 'Perfil do usuário autenticado (sem família/parceiros)' })
  @ApiResponse({ status: 200, type: UserPublicDto })
  me(@CurrentUser() user: User): UserPublicDto {
    return this.toPublic(user);
  }

  // ----- PATCH /users/me — edita nome e avatar -----
  @Patch('me')
  @ApiOperation({ summary: 'Edita nome e/ou avatar do usuário' })
  @ApiResponse({ status: 200, type: UserPublicDto })
  async updateMe(@CurrentUser() user: User, @Body() dto: UpdateUserDto): Promise<UserPublicDto> {
    const updated = await this.users.updateProfile(user.id, dto);
    return this.toPublic(updated);
  }

  // ----- PUT /users/me/fcm-token — registra/atualiza token FCM -----
  @Put('me/fcm-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Registra o token FCM do device atual (null remove o registro)',
  })
  async updateFcmToken(@CurrentUser() user: User, @Body() dto: UpdateFcmTokenDto): Promise<void> {
    await this.users.updateFcmToken(user.id, dto.fcmToken);
  }

  // ----- DELETE /users/me — exclui conta (LGPD) -----
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Exclui a conta (soft-delete). Família vazia + bebês são soft-deletados junto.',
  })
  async deleteMe(@CurrentUser() user: User): Promise<void> {
    await this.users.deleteAccount(user.id);
    // Revoga todas as sessões — qualquer request com token antigo retorna 401.
    await this.refreshTokens.revokeAllForUser(user.id);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private toPublic(user: User): UserPublicDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarStyle: user.avatarStyle,
      avatarSeed: user.avatarSeed,
      familyId: user.familyId,
    };
  }
}
