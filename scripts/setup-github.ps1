# =============================================================================
# Script: setup-github.ps1
# Descrição: Cria os 5 milestones (uma por fase) e os 9 labels do BebeCare
#            no repositório remoto via GitHub CLI.
#
# Pré-requisitos:
#   - GitHub CLI instalado (https://cli.github.com/)
#       winget install --id GitHub.cli
#   - Login feito:
#       gh auth login
#   - Rodar dentro de um clone do repositório (este script lê o remote 'origin')
#
# Uso:
#   PowerShell> .\scripts\setup-github.ps1
#
# Idempotente: rodar mais de uma vez não duplica nada (ignora "already exists").
# =============================================================================

$ErrorActionPreference = 'Stop'

# Confere se o gh está instalado
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) não encontrado." -ForegroundColor Red
    Write-Host "   Instale com: winget install --id GitHub.cli" -ForegroundColor Yellow
    exit 1
}

# Confere se está autenticado
$null = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Você não está autenticado no gh." -ForegroundColor Red
    Write-Host "   Rode: gh auth login" -ForegroundColor Yellow
    exit 1
}

# Detecta o repo a partir do remote 'origin'
$repo = gh repo view --json nameWithOwner --jq .nameWithOwner
if (-not $repo) {
    Write-Host "❌ Não consegui detectar o repositório. Rode dentro de um clone." -ForegroundColor Red
    exit 1
}
Write-Host "🎯 Configurando repositório: $repo" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------------------------------------
# Milestones (uma por fase)
# -----------------------------------------------------------------------------
Write-Host "📌 Criando milestones..." -ForegroundColor Cyan

$milestones = @(
    @{ title = 'Fase 1 — Fundação'; description = 'Setup, Docker, banco, auth JWT, convite de casal, perfil do bebê.' }
    @{ title = 'Fase 2 — Vacinas e consultas'; description = 'Calendário de vacinas PNI + agenda de consultas pediátricas.' }
    @{ title = 'Fase 3 — Medicação'; description = 'Lista de remédios com alertas + upload de receitas médicas.' }
    @{ title = 'Fase 4 — Compras compartilhadas'; description = 'Lista de compras em tempo real via WebSocket.' }
    @{ title = 'Fase 5 — Memória e polish'; description = 'Diário de marcos, exportar PDF, publicação e README final.' }
)

foreach ($m in $milestones) {
    $body = @{
        title       = $m.title
        description = $m.description
        state       = 'open'
    } | ConvertTo-Json -Compress

    $result = $body | gh api "repos/$repo/milestones" --method POST --input - 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $($m.title)" -ForegroundColor Green
    } elseif ($result -match 'already_exists') {
        Write-Host "  ⏭  $($m.title) (já existe)" -ForegroundColor DarkGray
    } else {
        Write-Host "  ❌ $($m.title) — $result" -ForegroundColor Red
    }
}

Write-Host ""

# -----------------------------------------------------------------------------
# Labels (área, tipo, prioridade)
# -----------------------------------------------------------------------------
Write-Host "🏷  Criando labels..." -ForegroundColor Cyan

$labels = @(
    # Área
    @{ name = 'area:api';      color = '0E8A16'; description = 'Backend NestJS' }
    @{ name = 'area:mobile';   color = '1D76DB'; description = 'App React Native' }
    @{ name = 'area:infra';    color = 'F9A825'; description = 'Docker, banco, CI/CD' }
    @{ name = 'area:docs';     color = '5319E7'; description = 'README, guias, docs em geral' }

    # Tipo
    @{ name = 'type:feature';  color = 'A2EEEF'; description = 'Nova funcionalidade' }
    @{ name = 'type:bug';      color = 'D73A4A'; description = 'Bug reportado / a corrigir' }
    @{ name = 'type:chore';    color = 'CFD3D7'; description = 'Refatoração, deps, ajustes internos' }

    # Prioridade
    @{ name = 'priority:high';   color = 'B60205'; description = 'Bloqueador ou caminho crítico' }
    @{ name = 'priority:medium'; color = 'FBCA04'; description = 'Importante, não bloqueador' }
    @{ name = 'priority:low';    color = '0E8A16'; description = 'Nice to have' }
)

foreach ($l in $labels) {
    $result = gh label create $l.name `
        --repo $repo `
        --color $l.color `
        --description $l.description `
        --force 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $($l.name)" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $($l.name) — $result" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Pronto! Confira em:" -ForegroundColor Cyan
Write-Host "   Milestones: https://github.com/$repo/milestones"
Write-Host "   Labels:     https://github.com/$repo/labels"
