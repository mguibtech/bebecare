# 🏪 Ficha da Play Store — BebeCare

Conteúdo pronto pra colar no Google Play Console quando for publicar (Fase D).
Documento de trabalho interno (raiz do repo). Mercado primário: **pt-BR**.

> Pré-requisitos: conta Google Play Developer (US$ 25), app já hospedado
> (ver [DEPLOY.md](DEPLOY.md)) e os assets gráficos abaixo.

---

## Identidade

| Campo | Valor |
|---|---|
| Nome do app (≤30) | `BebeCare — Saúde do bebê` |
| Package | `com.bebecare` |
| Categoria | **Saúde e fitness** (evita o escrutínio extra de "Médico") |
| Tags | bebê, vacinas, saúde infantil, maternidade, paternidade |
| Site | https://mguibtech.github.io/bebecare/ |
| Política de privacidade | https://mguibtech.github.io/bebecare/privacidade.html |
| E-mail de contato | (definir — um e-mail de suporte real) |

## Descrição curta (≤80 caracteres)

```
Vacinas, consultas, remédios e a rotina do bebê. A família junta, num app só.
```

## Descrição completa (≤4000 caracteres)

```
O BebeCare reúne tudo da saúde e da rotina do seu bebê num lugar só — pra você
cuidar com tranquilidade e sem esquecer nada.

Pensado pra famílias brasileiras: pai e mãe (ou quem cuida) acompanham o mesmo
bebê, cada um no seu celular, sempre sincronizado.

✦ VACINAS EM DIA
Calendário completo do PNI (Programa Nacional de Imunizações), personalizado pela
idade do bebê. Veja o que está em dia, o que está próximo e o que atrasou — e
marque cada dose aplicada com lote e local.

✦ CONSULTAS DO PEDIATRA
Agende consultas, guarde anotações (peso, altura, prescrições) e receba um
lembrete antes da hora.

✦ REMÉDIOS COM ALARME DE VERDADE
Cadastre os remédios e os horários. O alarme toca na hora certa, mesmo com o app
fechado e a tela bloqueada — com opção de soneca. Nada de esquecer a dose.

✦ DESPERTADOR DA MAMADA
Lembretes de mamada, troca de fralda e soneca — inclusive no modo intervalo
(a cada 2, 3, 4 ou 6 horas).

✦ MODO SONINHO
Sons que ajudam o bebê a dormir (ruído branco, chuva, batimento e mais), com
timer e fade — tocam com a tela apagada.

✦ A FAMÍLIA JUNTA
Convide quem cuida do bebê com um código. Todo mundo vê e atualiza as mesmas
informações, em tempo real.

✦ TUDO DO BEBÊ
Perfil com avatar, medidas, tipo sanguíneo e observações. A aba "Hoje" mostra as
doses do dia num relance.

🌐 Em português e inglês (segue o idioma do seu celular).
🔒 Seus dados são seus: criptografados em trânsito, sem compartilhamento com
terceiros, e você pode excluir a conta quando quiser.

O BebeCare é gratuito e não tem anúncios.

Cuidar de um bebê já dá trabalho suficiente. Deixa a parte de lembrar com a gente.
```

---

## Classificação e público-alvo

- **Questionário de classificação de conteúdo (IARC):** sem violência, sem
  conteúdo sexual, sem álcool/drogas, sem apostas → deve resultar em **Livre / L**.
- **Público-alvo:** **adultos (pais/responsáveis), 18+.** NÃO marcar como "app
  para crianças" → fica **fora** do programa *Designed for Families*. O app é uma
  ferramenta pros responsáveis, não um app infantil.

## Data Safety (Segurança dos dados) — respostas

**Gerais:**
- Coleta/compartilha dados? **Coleta sim, compartilha não.**
- Dados criptografados em trânsito? **Sim.**
- Permite excluir dados/conta? **Sim** (Mais → Excluir minha conta).

**Tipos coletados** (todos: coletados, **não** compartilhados, finalidade
*Funcionalidade do app*, obrigatórios pra função):

| Categoria | Dados |
|---|---|
| Informações pessoais | Nome, e-mail; dados do bebê (nome, sexo, nascimento) |
| Informações de saúde e fitness | Vacinas, remédios, consultas |
| IDs do dispositivo | Token FCM (push) |

> Nada de localização, contatos, fotos, áudio, financeiro ou histórico de
> navegação.

---

## Assets gráficos necessários

| Asset | Spec | Status |
|---|---|---|
| Ícone | 512×512 PNG, 32-bit | ✅ existe (gerar export 512) |
| Feature graphic | 1024×500 PNG/JPG | ⬜ criar |
| Screenshots (telefone) | mín. 2 (recomendado 4–8), 16:9 ou 9:16, lado ≥ 320px | ⬜ capturar |
| Screenshots (tablet 7"/10") | opcional | ⬜ |
| Vídeo promocional (YouTube) | opcional | ⬜ |

> 💡 As screenshots ficam melhores **depois** do polimento de UX do
> [DESIGN_REVIEW.md](DESIGN_REVIEW.md) (estados vazios, large-title, tipografia).
> Sugestão de telas pra screenshot: Hoje, Vacinas (calendário), Detalhe de vacina,
> Remédio + alarme, Modo Soninho, Família.

## Release notes — v1.0.0

```
Primeira versão do BebeCare 🎉
- Calendário de vacinas do PNI
- Consultas e remédios com lembretes
- Despertador da mamada e Modo Soninho
- Acompanhamento em família, em tempo real
- Português e inglês
```

---

## Fluxo de publicação (faixas)

1. Criar o app no Console → preencher ficha (acima) + Data Safety + classificação.
2. Subir o **AAB assinado** (ver seção Mobile do [DEPLOY.md](DEPLOY.md)) na faixa
   **Teste interno** → instalar e validar no device.
3. Promover pra **Teste fechado** (alguns testadores) → depois **Produção**.
4. `versionCode` deve subir a cada envio (o workflow de release usa `run_number`).

## Checklist de submissão

- [ ] Conta Google Play Developer criada (US$ 25)
- [ ] App hospedado e funcionando (DEPLOY.md) + `API_BASE_URL_PROD` apontando pro Render
- [ ] Ícone 512 + feature graphic 1024×500 + ≥2 screenshots
- [ ] Ficha preenchida (nome, descrições, categoria)
- [ ] Data Safety respondido conforme acima
- [ ] Classificação de conteúdo (questionário IARC)
- [ ] Público-alvo 18+ (fora do Families)
- [ ] URL de privacidade na ficha
- [ ] AAB assinado na faixa interna → testado → produção
