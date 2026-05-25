import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { User } from '../users/entities/user.entity';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import {
  AuthResponseDto,
  MeResponseDto,
} from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ----- REGISTER -----------------------------------------------------
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registra um novo usuário (opcionalmente via convite)' })
  @ApiResponse({ status: 201, type: AuthResponseDto })
  async register(@Body() dto: RegisterDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.authService.register(dto, this.extractContext(req));
  }

  // ----- LOGIN --------------------------------------------------------
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Autentica usuário por email/senha' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async login(@Body() dto: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.authService.login(dto, this.extractContext(req));
  }

  // ----- REFRESH ------------------------------------------------------
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Troca um refresh token por um novo par (access + refresh rotacionado)',
  })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  async refresh(@Body() dto: RefreshDto, @Req() req: Request): Promise<AuthResponseDto> {
    return this.authService.refresh(dto.refreshToken, this.extractContext(req));
  }

  // ----- LOGOUT -------------------------------------------------------
  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga o refresh token atual (logout deste device)' })
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  // ----- LOGOUT-ALL (autenticado) -------------------------------------
  @ApiBearerAuth()
  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Revoga TODOS os refresh tokens do usuário (logout em todos os devices)',
  })
  async logoutAll(@CurrentUser() user: User): Promise<void> {
    await this.authService.logoutAll(user.id);
  }

  // ----- ME -----------------------------------------------------------
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Retorna o usuário autenticado + casal + parceiro' })
  @ApiResponse({ status: 200, type: MeResponseDto })
  async me(@CurrentUser() user: User): Promise<MeResponseDto> {
    return this.authService.buildMeResponse(user);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private extractContext(req: Request) {
    const xff = req.headers['x-forwarded-for'];
    const ipFromHeader = Array.isArray(xff) ? xff[0] : xff?.split(',')[0]?.trim();
    return {
      ip: ipFromHeader ?? req.ip ?? null,
      userAgent: req.headers['user-agent'] ?? null,
    };
  }
}
