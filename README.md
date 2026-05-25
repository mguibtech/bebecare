<div align="center">

# 🍼 BebeCare

**App de saúde para bebês — vacinas PNI, consultas, remédios e diário de marcos.**

Projeto pessoal e portfólio, construído enquanto acompanho o desenvolvimento do meu filho.

[![CI](https://github.com/mguibtech/bebecare/actions/workflows/api-ci.yml/badge.svg)](https://github.com/mguibtech/bebecare/actions/workflows/api-ci.yml)
[![Node](https://img.shields.io/badge/node-20%20LTS-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/nestjs-11-E0234E?logo=nestjs&logoColor=white)](https://nestjs.com/)
[![React Native](https://img.shields.io/badge/react--native-CLI-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

</div>

---

## 💡 Sobre o projeto

Quando meu filho nasceu, percebi que organizar **vacinas, consultas, doses de remédio e marcos do desenvolvimento** em apps genéricos era frustrante: agendas viravam bagunça, lembretes se perdiam, e eu e minha esposa repetíamos as mesmas perguntas no WhatsApp.

O **BebeCare** nasceu desse incômodo real. Ele cobre o que pais brasileiros realmente precisam — incluindo o **calendário oficial de vacinação do PNI** — e é compartilhado entre o casal em tempo real.

Além de uso pessoal diário, o projeto serve como **portfólio técnico** demonstrando React Native CLI, NestJS, PostgreSQL, Firebase Cloud Messaging, WebSocket e Docker em um cenário realista de produto.

## 📱 Funcionalidades

| Fase | Funcionalidade                                        | Status         |
| ---- | ----------------------------------------------------- | -------------- |
| 1    | Setup do monorepo + infraestrutura Docker             | ✅ Concluído    |
| 1    | Autenticação JWT + convite de casal                   | 🚧 Em andamento |
| 1    | Cadastro do perfil do bebê                            | 📅 Planejado    |
| 2    | Calendário de vacinas seguindo o **PNI** brasileiro   | 📅 Planejado    |
| 2    | Agenda de consultas pediátricas                       | 📅 Planejado    |
| 3    | Lista de remédios com lembretes push                  | 📅 Planejado    |
| 3    | Upload de receitas médicas (foto / PDF)               | 📅 Planejado    |
| 4    | Lista de compras compartilhada em tempo real          | 📅 Planejado    |
| 5    | Diário de marcos do desenvolvimento                   | 📅 Planejado    |
| 5    | Exportar histórico em PDF                             | 📅 Planejado    |

## 🛠 Stack

```mermaid
flowchart LR
    A[📱 Mobile<br/>React Native CLI]
    B[🌐 API REST<br/>NestJS]
    C[(🐘 PostgreSQL)]
    D[🔥 Firebase<br/>Cloud Messaging]
    A <-->|HTTPS + JWT| B
    B <-->|TypeORM| C
    B -.->|Push notifications| D
    D -.->|FCM| A
```

- **Mobile:** React Native CLI (bare), TypeScript, React Navigation, TanStack Query, Zustand, React Native Paper
- **API:** NestJS 11, TypeScript, TypeORM, PostgreSQL 16, JWT (Passport), Swagger
- **Push:** Firebase Cloud Messaging
- **Real-time:** WebSocket (Socket.IO via NestJS gateway) — para lista de compras
- **Infra dev:** Docker Compose (PostgreSQL + pgAdmin)
- **CI:** GitHub Actions (lint + testes + e2e com Postgres)

## 📸 Screenshots

> _Em breve. As primeiras telas serão adicionadas conforme a Fase 1 evolui._

<!--
| Login & cadastro | Perfil do bebê | Calendário de vacinas |
| :---: | :---: | :---: |
| ![](./docs/img/login.png) | ![](./docs/img/baby-profile.png) | ![](./docs/img/vaccines.png) |
-->

## 🚀 Como rodar localmente

Guia técnico completo em **[`docs/SETUP.md`](./docs/SETUP.md)**.

Resumo (na raiz do projeto):

```powershell
copy .env.example .env
copy apps\api\.env.example apps\api\.env
npm run db:up         # sobe Postgres + pgAdmin
npm run api:install   # instala deps da API
npm run api:dev       # API em watch
```

Em seguida, acesse `http://localhost:3000/api/health` — deve retornar `{ "status": "ok", "db": "up" }`.

## 🗺 Roadmap

- **Fase 1 — Fundação:** monorepo, Docker, banco, auth JWT, convite de casal, perfil do bebê
- **Fase 2 — Saúde básica:** calendário de vacinas (PNI) + agenda de consultas
- **Fase 3 — Medicação:** remédios com alertas + upload de receitas médicas
- **Fase 4 — Compras compartilhadas:** lista em tempo real via WebSocket
- **Fase 5 — Memória & polish:** diário de marcos, exportar PDF, publicação

## 🧭 Decisões de arquitetura

- **Monorepo "de pobre"** — `apps/api` e `apps/mobile` são projetos independentes (sem npm workspaces). Evita atrito do React Native CLI com hoisting de `node_modules`, mantém o repositório único como vitrine.
- **React Native CLI (bare), não Expo** — controle total do projeto nativo, liberdade para configurar Firebase, Keychain e libs nativas sem ejetar.
- **Sempre migrations TypeORM** — `synchronize: false`. Schema é versionado.
- **Convenções:** nomes em inglês, comentários em português, [Conventional Commits](https://www.conventionalcommits.org/) em todos os commits.

## 👨‍💻 Autor

**Mguib** — desenvolvedor em Manaus-AM. Criador também do [NavegaJa](https://github.com/mguibtech), app de transporte fluvial na Amazônia.

- LinkedIn: _adicionar_
- Portfolio: _adicionar_

## 📄 Licença

[MIT](./LICENSE) — sinta-se livre para estudar, remixar e usar.
