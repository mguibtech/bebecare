import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { User } from '../users/entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FamilyInvite } from './entities/family-invite.entity';
import { FamilyInvitesService, FAMILY_LIMITS } from './family-invites.service';
import { FamiliesService } from './families.service';
import { FamilyDetailsDto, FamilyMemberDto } from './dto/family-details.dto';
import { InviteResponseDto } from './dto/invite-response.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';

@ApiBearerAuth()
@ApiTags('families')
@Controller('families')
export class FamiliesController {
  constructor(
    private readonly families: FamiliesService,
    private readonly invites: FamilyInvitesService,
  ) {}

  // -------------------------------------------------------------------
  // GET /families/me — visão completa da família atual
  // -------------------------------------------------------------------
  @Get('me')
  @ApiOperation({
    summary: 'Visão detalhada da família atual (membros + convites pendentes)',
  })
  @ApiResponse({ status: 200, type: FamilyDetailsDto })
  async getMe(@CurrentUser() user: User): Promise<FamilyDetailsDto> {
    const family = await this.families.findByIdWithMembers(user.familyId);
    if (!family) {
      // Não deveria acontecer (invariante: todo user tem família).
      // NotFoundException (404) em vez de Error cru, que viraria 500.
      throw new NotFoundException('Família do usuário não encontrada — estado inconsistente');
    }
    const pending = await this.invites.listPendingForFamily(user.familyId);

    return {
      id: family.id,
      name: family.name,
      members: family.members.map((m) => this.toMemberDto(m, user.id)),
      pendingInvites: pending.map((i) => this.toInviteDto(i)),
      maxMembers: FAMILY_LIMITS.MAX_MEMBERS,
    };
  }

  // -------------------------------------------------------------------
  // PATCH /families/me — renomeia a família
  // -------------------------------------------------------------------
  @Patch('me')
  @ApiOperation({ summary: 'Renomeia a família (passa null em name para limpar)' })
  @ApiResponse({ status: 200, type: FamilyDetailsDto })
  async update(@CurrentUser() user: User, @Body() dto: UpdateFamilyDto): Promise<FamilyDetailsDto> {
    if (dto.name !== undefined) {
      await this.families.updateName(user.familyId, dto.name ?? null);
    }
    return this.getMe(user);
  }

  // -------------------------------------------------------------------
  // POST /families/me/invites — gera novo convite
  // -------------------------------------------------------------------
  @Post('me/invites')
  @ApiOperation({
    summary: 'Gera um novo convite (código de 6 dígitos válido por 7 dias)',
  })
  @ApiResponse({ status: 201, type: InviteResponseDto })
  async createInvite(@CurrentUser() user: User): Promise<InviteResponseDto> {
    const invite = await this.invites.create(user);
    // Reaproveita o user atual como createdByUser (mutação direta para preservar
    // a instância da classe — spread converteria para plain object e perderia
    // métodos como assignUuid, quebrando o tipo FamilyInvite).
    invite.createdByUser = user;
    return this.toInviteDto(invite);
  }

  // -------------------------------------------------------------------
  // GET /families/me/invites — lista convites pendentes
  // -------------------------------------------------------------------
  @Get('me/invites')
  @ApiOperation({ summary: 'Lista convites pendentes (ativos e não expirados)' })
  @ApiResponse({ status: 200, type: [InviteResponseDto] })
  async listInvites(@CurrentUser() user: User): Promise<InviteResponseDto[]> {
    const pending = await this.invites.listPendingForFamily(user.familyId);
    return pending.map((i) => this.toInviteDto(i));
  }

  // -------------------------------------------------------------------
  // DELETE /families/me/invites/:id — revoga convite
  // -------------------------------------------------------------------
  @Delete('me/invites/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoga um convite pendente' })
  async revokeInvite(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.invites.revoke(id, user);
  }

  // -------------------------------------------------------------------
  // POST /families/me/leave — sai da família atual
  // -------------------------------------------------------------------
  @Post('me/leave')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Sai da família atual (cria nova família solo). Falha se for o único membro.',
  })
  async leave(@CurrentUser() user: User): Promise<void> {
    await this.families.leaveFamily(user);
    // Mobile deve recarregar /auth/me em seguida — o user agora aponta para outra family.
  }

  // -------------------------------------------------------------------
  // DELETE /families/me/members/:userId — remove outro membro
  // -------------------------------------------------------------------
  @Delete('me/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove outro membro da família (ele vai para uma nova família solo)',
  })
  async removeMember(
    @CurrentUser() user: User,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<void> {
    await this.families.removeMember(userId, user);
  }

  // -------------------------------------------------------------------
  // HELPERS
  // -------------------------------------------------------------------
  private toMemberDto(member: User, currentUserId: string): FamilyMemberDto {
    return {
      id: member.id,
      name: member.name,
      avatarStyle: member.avatarStyle,
      avatarSeed: member.avatarSeed,
      isMe: member.id === currentUserId,
    };
  }

  private toInviteDto(invite: FamilyInvite): InviteResponseDto {
    return {
      id: invite.id,
      code: invite.code,
      status: invite.status,
      expiresAt: invite.expiresAt.toISOString(),
      createdAt: invite.createdAt.toISOString(),
      createdByName: invite.createdByUser?.name ?? 'desconhecido',
    };
  }
}
