import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { FamilyInviteStatus } from '../../common/enums/family-invite-status.enum';
import { FamilyInvite } from '../families/entities/family-invite.entity';
import { FamiliesService } from '../families/families.service';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import {
  AuthResponseDto,
  FamilyMemberPublicDto,
  FamilySummaryDto,
  MeResponseDto,
  UserPublicDto,
} from './dto/auth-response.dto';
import { RefreshTokenService } from '../refresh-tokens/refresh-tokens.service';
import { JwtPayload } from './types/jwt-payload.type';

export interface AuthContext {
  ip?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuthService {
  // Bcrypt cost — 10 é o equilíbrio padrão (≈100ms num servidor comum).
  // Em produção real, pode subir para 12 conforme servidor aguentar.
  private readonly BCRYPT_ROUNDS = 10;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(FamilyInvite)
    private readonly invites: Repository<FamilyInvite>,
    private readonly users: UsersService,
    private readonly families: FamiliesService,
    private readonly jwt: JwtService,
    private readonly refreshTokens: RefreshTokenService,
    private readonly config: ConfigService,
  ) {}

  // --------------------------------------------------------------------
  // REGISTER
  // --------------------------------------------------------------------
  async register(dto: RegisterDto, ctx: AuthContext = {}): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase().trim();

    // Email já em uso?
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException('Email já cadastrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    // Transação: cria family (ou usa a do convite) + user + atualiza convite se houver
    const user = await this.dataSource.transaction(async (manager) => {
      let familyId: string;
      let invite: FamilyInvite | null = null;

      if (dto.inviteCode) {
        invite = await this.findValidInvite(dto.inviteCode, manager);
        familyId = invite.familyId;
      } else {
        const family = await this.families.create(manager);
        familyId = family.id;
      }

      const createdUser = await this.users.create(
        {
          email,
          name: dto.name,
          passwordHash,
          familyId,
        },
        manager,
      );

      if (invite) {
        invite.status = FamilyInviteStatus.ACCEPTED;
        invite.acceptedByUserId = createdUser.id;
        invite.acceptedAt = new Date();
        await manager.save(FamilyInvite, invite);
      }

      return createdUser;
    });

    return this.issueTokensAndBuildResponse(user, ctx);
  }

  // --------------------------------------------------------------------
  // LOGIN
  // --------------------------------------------------------------------
  async login(dto: LoginDto, ctx: AuthContext = {}): Promise<AuthResponseDto> {
    const user = await this.validateCredentials(dto.email, dto.password);
    return this.issueTokensAndBuildResponse(user, ctx);
  }

  // Valida email + senha. Retorna o User completo (sem o hash) ou lança 401.
  private async validateCredentials(email: string, password: string): Promise<User> {
    const user = await this.users.findByEmail(email, true);
    if (!user) {
      // Mensagem genérica para não vazar se o email existe ou não.
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Não devolve o hash em nenhum cenário (descarta com rest spread).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...safe } = user;
    return safe as User;
  }

  // --------------------------------------------------------------------
  // REFRESH
  // --------------------------------------------------------------------
  async refresh(refreshToken: string, ctx: AuthContext = {}): Promise<AuthResponseDto> {
    const record = await this.refreshTokens.validate(refreshToken);
    const user = await this.users.findById(record.userId);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    // Rotaciona: revoga o atual e emite um novo
    const next = await this.refreshTokens.rotate(record, ctx);
    const accessToken = await this.signAccessToken(user.id);

    return {
      user: this.toPublicUser(user),
      accessToken,
      refreshToken: next.plainToken,
      expiresIn: this.accessTokenLifetimeSeconds(),
    };
  }

  // --------------------------------------------------------------------
  // LOGOUT
  // --------------------------------------------------------------------
  async logout(refreshToken: string): Promise<void> {
    await this.refreshTokens.revoke(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokens.revokeAllForUser(userId);
  }

  // --------------------------------------------------------------------
  // ME (com family e outros membros)
  // --------------------------------------------------------------------
  async buildMeResponse(user: User): Promise<MeResponseDto> {
    const family = await this.families.findByIdWithMembers(user.familyId);
    const otherMembers = (family?.members ?? []).filter((u) => u.id !== user.id);

    const familyDto: FamilySummaryDto = {
      id: user.familyId,
      name: family?.name ?? null,
      members: otherMembers.map((m) => this.toFamilyMemberDto(m)),
    };

    return {
      user: this.toPublicUser(user),
      family: familyDto,
    };
  }

  // --------------------------------------------------------------------
  // HELPERS
  // --------------------------------------------------------------------
  private async issueTokensAndBuildResponse(
    user: User,
    ctx: AuthContext,
  ): Promise<AuthResponseDto> {
    const accessToken = await this.signAccessToken(user.id);
    const { plainToken: refreshToken } = await this.refreshTokens.issue({
      userId: user.id,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return {
      user: this.toPublicUser(user),
      accessToken,
      refreshToken,
      expiresIn: this.accessTokenLifetimeSeconds(),
    };
  }

  private async signAccessToken(userId: string): Promise<string> {
    const payload: JwtPayload = { sub: userId };
    return this.jwt.signAsync(payload);
  }

  // Converte o formato configurado (ex.: '15m', '1h') em segundos.
  // O JwtModule já lida com essa string internamente para o exp; aqui apenas
  // calculamos o número que devolvemos ao cliente para conveniência.
  private accessTokenLifetimeSeconds(): number {
    const raw = this.config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    const match = raw.match(/^(\d+)\s*([smhd])?$/);
    if (!match) return 900;
    const value = parseInt(match[1], 10);
    const unit = (match[2] ?? 's').toLowerCase();
    return unit === 'd'
      ? value * 86400
      : unit === 'h'
        ? value * 3600
        : unit === 'm'
          ? value * 60
          : value;
  }

  private async findValidInvite(code: string, manager: EntityManager): Promise<FamilyInvite> {
    const invite = await manager.findOne(FamilyInvite, {
      where: { code },
    });

    if (!invite) {
      throw new BadRequestException('Código de convite inválido');
    }

    if (invite.status !== FamilyInviteStatus.PENDING) {
      throw new BadRequestException('Convite já foi usado ou cancelado');
    }

    if (invite.expiresAt < new Date()) {
      // Marca como expirado de forma oportuna (não obrigatório, mas mantém o estado correto).
      invite.status = FamilyInviteStatus.EXPIRED;
      await manager.save(FamilyInvite, invite);
      throw new BadRequestException('Convite expirado');
    }

    return invite;
  }

  private toPublicUser(user: User): UserPublicDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarStyle: user.avatarStyle,
      avatarSeed: user.avatarSeed,
      familyId: user.familyId,
    };
  }

  private toFamilyMemberDto(user: User): FamilyMemberPublicDto {
    return {
      id: user.id,
      name: user.name,
      avatarStyle: user.avatarStyle,
      avatarSeed: user.avatarSeed,
    };
  }
}
