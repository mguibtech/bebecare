import { randomBytes, createHash } from 'crypto';
import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from './entities/refresh-token.entity';

export interface IssueRefreshTokenOptions {
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
}

export interface RotateRefreshTokenResult {
  // Token plain text que vai para o cliente (só existe em memória)
  plainToken: string;
  // Entidade salva no banco (com hash)
  record: RefreshToken;
}

@Injectable()
export class RefreshTokenService {
  private readonly logger = new Logger(RefreshTokenService.name);

  constructor(
    @InjectRepository(RefreshToken) private readonly tokens: Repository<RefreshToken>,
    private readonly config: ConfigService,
  ) {}

  // Gera 256 bits (32 bytes) de entropia em hex. Resulta em 64 chars.
  private generatePlainToken(): string {
    return randomBytes(32).toString('hex');
  }

  // Hash sha256 do token. Só o hash vai pro banco.
  private hashToken(plain: string): string {
    return createHash('sha256').update(plain).digest('hex');
  }

  // Lê o tempo de vida do refresh token a partir do .env. Aceita formatos
  // como '30d', '720h', '43200m' (a mesma sintaxe do jsonwebtoken).
  // Aqui convertemos manualmente para timestamp.
  private computeExpiresAt(): Date {
    const raw = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');
    const match = raw.match(/^(\d+)\s*([smhd])?$/);
    if (!match) {
      throw new Error(
        `JWT_REFRESH_EXPIRES_IN inválido: "${raw}". Use formato como "30d", "12h", "60m"`,
      );
    }
    const value = parseInt(match[1], 10);
    const unit = (match[2] ?? 's').toLowerCase();
    const seconds =
      unit === 'd' ? value * 86400 :
      unit === 'h' ? value * 3600 :
      unit === 'm' ? value * 60 :
      value;

    return new Date(Date.now() + seconds * 1000);
  }

  // Emite um novo refresh token para o user e persiste o hash.
  async issue(options: IssueRefreshTokenOptions): Promise<RotateRefreshTokenResult> {
    const plainToken = this.generatePlainToken();
    const tokenHash = this.hashToken(plainToken);
    const expiresAt = this.computeExpiresAt();

    const record = this.tokens.create({
      tokenHash,
      userId: options.userId,
      expiresAt,
      createdByIp: options.ip ?? null,
      userAgent: options.userAgent ?? null,
    });

    await this.tokens.save(record);
    return { plainToken, record };
  }

  // Valida um refresh recebido do cliente:
  //  - existe no banco?
  //  - não está revogado?
  //  - não está expirado?
  // Se algo falhar, lança UnauthorizedException. Detecta refresh já revogado
  // e revoga toda a cadeia do user (provável uso indevido).
  async validate(plainToken: string): Promise<RefreshToken> {
    const tokenHash = this.hashToken(plainToken);
    const record = await this.tokens.findOne({ where: { tokenHash } });

    if (!record) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (record.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    if (record.revokedAt) {
      // Refresh revogado sendo reutilizado — sinal forte de comprometimento.
      // Revoga todos os refresh do usuário pra forçar novo login em todos os devices.
      this.logger.warn(
        `Refresh token revogado foi reutilizado para userId=${record.userId}. Revogando todos.`,
      );
      await this.revokeAllForUser(record.userId);
      throw new UnauthorizedException('Refresh token comprometido — faça login novamente');
    }

    return record;
  }

  // Rotaciona: marca o atual como revogado, emite um novo, e linka os dois.
  async rotate(
    current: RefreshToken,
    options: { ip?: string | null; userAgent?: string | null } = {},
  ): Promise<RotateRefreshTokenResult> {
    const next = await this.issue({
      userId: current.userId,
      ip: options.ip,
      userAgent: options.userAgent,
    });

    current.revokedAt = new Date();
    current.replacedById = next.record.id;
    await this.tokens.save(current);

    return next;
  }

  // Revoga um único refresh (usado em /auth/logout).
  async revoke(plainToken: string): Promise<void> {
    const tokenHash = this.hashToken(plainToken);
    await this.tokens.update(
      { tokenHash, revokedAt: undefined },
      { revokedAt: new Date() },
    );
  }

  // Revoga todos os refresh ativos de um user (logout de todos os devices ou
  // detecção de comprometimento).
  async revokeAllForUser(userId: string): Promise<void> {
    await this.tokens
      .createQueryBuilder()
      .update(RefreshToken)
      .set({ revokedAt: new Date() })
      .where('user_id = :userId', { userId })
      .andWhere('revoked_at IS NULL')
      .execute();
  }
}
