# Design Review — BebeCare

> Avaliação UX/UI feita ao final do M4 (2026-05-28). Não-bloqueia releases — guia de prioridades pra M10 (polish + release).

## Contexto

App de saúde para bebês, voltado pra pais brasileiros. Stack mobile: React Native CLI + Material Design 3 (Paper). Sistema de design tem 2 paletas (rosa/azul) × 3 modos (light/dark/system).

Avaliado depois dos marcos:
- M0–M2: Auth + temas + Reactotron
- M3: Família + bebê CRUD + convite com deep link
- M4: Vacinas PNI

---

## ✅ O que está sólido

### Decisões de produto bem fundamentadas
- **"Família" em vez de "Casal"** — inclusivo (mães/pais solo, homoafetivos, multigeracional). Decisão raríssima em apps brasileiros pequenos.
- **Foco em bebê humano**, sem tentar abraçar pets. Foco vence amplitude.
- **Status calculado no backend** (`APPLIED|OVERDUE|DUE|UPCOMING`) — front só renderiza. Source of truth correto.

### Sistema de cores com personalidade
- Paleta dupla (rosa/azul) com modo manual é uma escolha **excelente** pra app materno-infantil. Personaliza sem usar gênero como gatilho automático.
- `secondaryContainer` coerente com paleta escolhida — UX consistente após o fix do M3.

### Arquitetura de navegação enxuta
- 4 tabs (Início, Vacinas, Saúde, Mais) — clássica e correta. Resiste a virar "12 tabs".
- BabyForm/Detail e VaccineDetail como push full-screen — esconde tab bar durante fluxos focados. Padrão Material 3 certo.

### Pequenos toques de cuidado
- Avatar DiceBear customizável dá identidade sem exigir upload de foto (que pais raramente fariam).
- Helper text "pode deixar em branco se não souber" no form de bebê — fala a língua do usuário cansado.
- Pull-to-refresh nas Vacinas — gesto que pais já conhecem de Instagram/Gmail.

---

## ⚠️ Onde melhorar pra V1 publicável

### 1. Hierarquia tipográfica está rasa

**Problema:** Tudo usa variants padrão do Paper (`titleMedium`, `bodyMedium`) sem ajuste. Resultado: textos parecem ter o mesmo "peso" visual. O nome do bebê tem o mesmo tratamento de "Em breve: vacinas, consultas, remédios."

**Sugestão:** definir uma escala tipográfica própria com 4-5 níveis claros:
- `display`: 28-32px bold (nome de seção principal, ex.: "Vacinas")
- `title`: 18-20px semibold (cards principais)
- `body`: 14-15px regular
- `caption`: 12px regular opacity 0.6 (datas, metadados)
- `label`: 11px uppercase opacity 0.5 (seções)

Aplicar consistentemente em todas as telas.

### 2. Densidade × respiro: listas longas

Resolvido no M4 mas vale anotar como princípio: **cards grandes demais com espaço morto** matam scanabilidade quando tem 26+ itens. A versão densa atual (linha horizontal) é o caminho certo. Mesma lógica aplicar em **listas futuras** (consultas, remédios, marcos do diário).

**Regra de bolso:**
- Lista de >10 itens → layout de **linha (List.Item)** ou card 2-linhas
- Lista <5 itens "destacados" (próximas atividades na Home) → card grande faz sentido

### 3. Estados vazios fracos

**Problema:** as tabs Vacinas/Saúde sem bebê selecionado mostram só ícone + texto plano. Sem CTA forte, sem ilustração, sem voz da marca.

**Sugestão:**
- **Ilustração leve** (linha simples, não emoji), tipo um chocalho ou pé de bebê
- **Texto com voz de marca**: "Vamos começar? Cadastre o Theo na aba Início" — usar nome se já tem 1 bebê na família
- **Botão primário** que **leva pra ação** sem fazer o usuário pensar onde clicar

Estado vazio é onde o app comunica que se importa. Hoje está só "tela em branco com aviso".

### 4. Sistema de cores precisa de "neutros" definidos

**Problema:** usa muito `theme.colors.onSurface` + `opacity: 0.7` pra "texto secundário". Funciona, mas não é semântico. Em dark, esse cinza pode ficar ilegível em superfícies escuras (visto no "Em breve..." quase sumindo).

**Sugestão:** definir tokens semânticos:
- `text.primary` → onBackground (já tem)
- `text.secondary` → onSurfaceVariant (Paper já tem)
- `text.muted` → onSurface 60% (criar token explícito, não inline opacity)
- `text.error`, `text.success` → semânticos

Usar `theme.app.textSecondary` em vez de `style={{ opacity: 0.7 }}`. Mantém DRY e dark-safe.

### 5. Feedback de ação fraco

**Problema:** ao marcar vacina como aplicada (ou criar bebê, ou enviar convite), o usuário vê o sheet fechar e... talvez o card mudar. Sem confirmação explícita de sucesso.

**Sugestão:**
- **Snackbar de sucesso** padrão: "Vacina aplicada ✓ • Desfazer"
- **Animação de transição** sutil quando o chip muda de "Atrasada" → "Aplicada" (fade 200ms)
- Botões com **loading state** (já tem em alguns — garantir em todos)

Esses 3 microdetalhes elevam o app de "funciona" pra "feito com cuidado".

### 6. Header das tabs é mudo

**Problema:** removemos o header padrão das tabs (`headerShown: false`), mas a tela começa direto no conteúdo. Sem título grande, sem contexto. Em algumas screenshots dá pra confundir em qual tab você está se a tab bar tiver tido tap acidental.

**Sugestão Material 3:** **Large title pattern** (estilo iOS Large Title ou Material 3 LargeTopAppBar). Título grande no topo que **encolhe ao scrollar**, mantém contexto sem ocupar espaço quando o usuário está navegando dados.

Exemplo na tab Vacinas:
```
Vacinas                  [filtro]
Theo • 9 meses
─────────────
[cards]
```

### 7. Avatar do bebê é só estético, não funcional

**Problema:** o avatar DiceBear é bonito mas **não conta uma história** — não muda com a idade (recém-nascido → bebê → toddler), não tem variações de humor, não vira "personagem".

**Oportunidade futura (M10+):**
- Avatares que **evoluem com a idade** do bebê
- Pequenas animações ao marcar vacinas ("conquista")
- Onboarding com "escolha o avatar do Theo" mais interativo

Não pra V1, mas anota como diferencial competitivo poderoso.

### 8. Botões de ação destrutiva podem ser mais incômodos

**Problema:** "Excluir conta" e "Sair da família" usam Dialog padrão Paper com botão vermelho. Funciona, mas usuário cansado pode confirmar sem ler.

**Sugestão Material 3:** "Confirmar digitando" pra ações catastróficas. Tipo "Pra confirmar, digite EXCLUIR no campo abaixo". Atrito proposital — usado pelo GitHub e Stripe.

### 9. Falta um "Voltar pra Início" óbvio depois de fluxos

**Problema:** depois de criar bebê (BabyForm), o usuário cai onde? Hoje volta automaticamente pela navigation stack, mas não tem celebração nem "Pronto! Próximo passo: cadastre as primeiras vacinas →".

**Sugestão:** **success screen** breve (ou Snackbar com ação) depois de marcos importantes (1º bebê cadastrado, 1ª vacina marcada, 1º convite enviado). Pequenas dopaminas direcionando o próximo passo.

### 10. Acessibilidade (WCAG)

**Problema:** alguns chips/badges (especialmente no dark com paleta rosa) podem não atingir contraste 4.5:1.

**Ação:** rodar **WCAG color contrast checker** em todas as 4 combinações (rosa-light, rosa-dark, azul-light, azul-dark). Especialmente: texto sobre `surfaceVariant`, sobre `secondaryContainer`, sobre `primaryContainer`.

Tem ferramenta automatizada — vale criar um teste unitário que itera as paletas e falha se algum par <4.5:1.

---

## 🎯 Prioridades para V1 publicável (M10)

Ranqueado por impacto/esforço:

| # | Item | Impacto | Esforço |
|---|---|---|---|
| 1 | Estados vazios bem feitos (ilustração + CTA) | **Alto** | Médio |
| 2 | Feedback de sucesso (Snackbar/animação) | **Alto** | Baixo |
| 3 | Sistema tipográfico próprio (5 níveis) | Alto | Médio |
| 4 | Tokens semânticos de texto (text.muted, text.secondary) | Médio | Baixo |
| 5 | Large title pattern nas tabs | Médio | Médio |
| 6 | Contraste WCAG validado | Alto | Baixo |
| 7 | Success screens pós-ação importante | Médio | Médio |
| 8 | Avatar evolutivo do bebê | Diferencial | Alto |

---

## 🔍 Observações estratégicas

**O app está com cara de "MVP funcional, falta voz de marca".** O sistema técnico (4 paletas × 3 modos, arquitetura limpa, navegação correta) é **muito acima** da média de apps brasileiros desse porte. Mas falta um **tom de voz** unindo:

- Microcopy emocional pontual: "Hora da próxima vacina do Theo!" vs "Vacina pendente"
- Identidade visual além do esquema de cores (ilustração, ícones próprios, tipografia da marca)
- Pequenas histórias visuais (avatar que cresce, conquistas, marcos)

Pais não usam o app por feature — usam por **se sentirem cuidados**. O app deveria abraçar isso explicitamente na próxima iteração.

---

## Histórico de revisões

- **2026-05-28** (M4 fechado) — Primeira avaliação completa após Vacinas PNI funcionar end-to-end. App em estado "MVP técnico sólido, polish de marca pendente". Captado no contexto de ritmo acelerado de implementação (M0-M4 em 4 dias).
