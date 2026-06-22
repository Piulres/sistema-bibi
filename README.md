# Sistema Bibi

> Plataforma SaaS **HealthTech** (POC) para gestão inteligente de clínicas e
> hospitais, inspirada no modelo **ERPMed/Centtralmed**. Foco em **Pay Per Use**,
> previsibilidade financeira, extinção da burocracia e fidelização de pacientes.

---

## Índice

1. [Visão geral](#1-visão-geral)
2. [Pilares de negócio](#2-pilares-de-negócio)
3. [Arquitetura e stack](#3-arquitetura-e-stack)
4. [Início rápido](#4-início-rápido)
5. [URLs de teste](#5-urls-de-teste) ← *as rotas para você acessar*
6. [Credenciais de demonstração](#6-credenciais-de-demonstração)
7. [Fluxo end-to-end (Pay Per Use)](#7-fluxo-end-to-end-pay-per-use)
8. [Modelo de dados](#8-modelo-de-dados)
9. [Referência da API](#9-referência-da-api)
10. [Estrutura de pastas](#10-estrutura-de-pastas)
11. [Scripts disponíveis](#11-scripts-disponíveis)
12. [Segurança e LGPD](#12-segurança-e-lgpd)
13. [Notas técnicas e limitações da POC](#13-notas-técnicas-e-limitações-da-poc)
14. [Documentação adicional](#14-documentação-adicional)

---

## 1. Visão geral

O Sistema Bibi é uma plataforma multi-tenant (cada clínica/hospital é um *tenant*)
com **quatro portais segregados** por perfil de acesso. O objetivo da POC é
demonstrar o modelo de negócio **Pay Per Use**: o beneficiário paga apenas pelos
serviços (consultas e exames) efetivamente utilizados, com transparência prévia
de valores e faturamento sem perdas de informação.

| Portal | Público | Foco |
|--------|---------|------|
| **Portal do Prestador** | Médicos / profissionais de saúde | Agenda inteligente e prontuário eletrônico (PEP) |
| **Portal Interno** | Equipe administrativa | Dashboard executivo, faturamento, CRM, recorrência e comunicação |
| **Portal da Empresa (PJ)** | RH / gestores corporativos | Contratos e beneficiários corporativos |
| **Portal do Beneficiário** | Pacientes / beneficiários | Agenda, consumo Pay Per Use, faturas e assinatura |

## 2. Pilares de negócio

- **Pay Per Use** — cada procedimento utilizado é registrado com o preço
  *congelado* no momento do uso (snapshot), garantindo transparência prévia.
- **Precificação dinâmica** — regras por empresa ajustam o preço base (ex.:
  desconto corporativo de 15% para a TechCorp em consultas clínicas).
- **Previsibilidade financeira** — o faturamento agrega apenas o que foi usado e
  pode ser fechado ao final do atendimento ("fechado na alta").
- **Eficiência operacional** — fluxos curtos: agenda → atendimento → prontuário →
  faturamento, sem telas excessivas (anti *over-engineering*).
- **Mobile-first & nuvem** — interface responsiva, acessível de qualquer
  dispositivo.

## 3. Arquitetura e stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | **Next.js 16** (App Router) |
| UI | **React 19** + **Tailwind CSS v4** (mobile-first) |
| Linguagem | **TypeScript** |
| ORM / Banco | **Prisma 6** + **SQLite** (dev) |
| Autenticação | Cookie de sessão **httpOnly** assinado com **HMAC-SHA256** |
| Proteção de rotas | `src/proxy.ts` (o "Proxy" do Next 16, antigo middleware) |

A API é exposta via **Route Handlers** (`src/app/api/**`). As páginas de dashboard
são *Server Components* que validam a sessão e o `role` no servidor antes de
renderizar os componentes de cliente que consomem a API.

## 4. Início rápido

Requisitos: **Node.js 20+** (testado com Node 22) e **npm**.

```bash
npm install            # instala dependências (postinstall roda `prisma generate`)
cp .env.example .env   # cria as variáveis de ambiente locais
npm run db:reset       # cria o schema SQLite e popula os dados de demonstração
npm run dev            # inicia o servidor de desenvolvimento
```

A aplicação sobe em **http://localhost:3000**.

> Variáveis de ambiente (`.env` — ver `.env.example`):
> - `DATABASE_URL` — caminho do SQLite (padrão `file:./dev.db`).
> - `SESSION_SECRET` — segredo usado para assinar o cookie de sessão.
> - `PAYMENT_GATEWAY` — `mock` (POC) ou `asaas`/`efi`/`inter` (adapters reais).
> - `COMMUNICATION_PROVIDER` — `console` (POC) ou `sendgrid`/`twilio`/`meta`.
> - `CRON_SECRET` — protege jobs `POST /api/cron/reminders` e `/api/cron/webhooks`.
> - `TELEMEDICINE_BASE_URL` — URL base das salas virtuais mock (telemedicina).
> - `SEED_SCALE` — volume da massa demo: `small` | `medium` (padrão) | `large`.
> - `ALLOW_DEMO_RESET` — habilita o botão de restaurar demo em `/interno/seguranca`
>   (padrão: ligado fora de `production`; em produção defina `true` explicitamente).

## 5. URLs de teste

Base local: **`http://localhost:3000`**
(na rede interna da VM o servidor também responde em `http://172.30.0.2:3000`).

**Produção (Netlify):** https://sistema-bibi.netlify.app — mesmas credenciais demo do seed.

### Páginas (interface)

| URL | Página | Acesso |
|-----|--------|--------|
| `/` | Landing page com seleção de portal | Público |
| `/login` | Login do **Portal do Prestador** | Público |
| `/prestador` | Dashboard do prestador (agenda do dia) | `PRESTADOR` |
| `/prestador/atendimento/{id}` | Detalhe do atendimento (procedimentos + PEP) | `PRESTADOR` |
| `/interno/login` | Login do **Portal Interno** | Público |
| `/interno/dashboard` | **Dashboard Executivo** — KPIs consolidados do tenant | `INTERNO` |
| `/interno` | Dashboard de faturamento (Pay Per Use) | `INTERNO` |
| `/interno/beneficiarios/{id}` | **Cliente 360°** — visão consolidada do beneficiário | `INTERNO` |
| `/interno/crm` | **CRM Corporativo** — pipeline de empresas | `INTERNO` |
| `/interno/assinaturas` | **Recorrência** — assinaturas e cobranças futuras | `INTERNO` |
| `/interno/comunicacao` | **Comunicação** — fila de e-mail, SMS e WhatsApp | `INTERNO` |
| `/interno/cadastros` | **Cadastros** — beneficiários, empresas, procedimentos, usuários | `INTERNO` |
| `/interno/agenda` | **Agenda** — criar e gerenciar agendamentos | `INTERNO` |
| `/interno/relatorios` | **Relatórios** — exportação CSV (faturamento, CRM) | `INTERNO` |
| `/interno/branding` | **White label** — cores, logo, tema, domínio custom | `INTERNO` |
| `/interno/integracoes` | **Integrações B2B** — webhooks outbound e log de entregas | `INTERNO` |
| `/interno/seguranca` | **Segurança** — MFA TOTP e restauração do modo demo (ADMIN) | `INTERNO` |
| `/beneficiario/login` | Login do **Portal do Beneficiário** | Público |
| `/beneficiario` | Self-service: agenda, consumo, faturas e assinatura | `BENEFICIARIO` |
| `/pj/login` | Login do **Portal da Empresa (PJ)** | Público |
| `/pj` | Dashboard corporativo (beneficiários e faturas) | `PJ` |

> As rotas protegidas redirecionam para o login do portal correspondente quando
> não há sessão válida.

### Links rápidos para teste

- Landing: http://localhost:3000/
- Prestador: http://localhost:3000/login
- Interno: http://localhost:3000/interno/login
- Beneficiário: http://localhost:3000/beneficiario/login
- Empresa (PJ): http://localhost:3000/pj/login

## 6. Credenciais de demonstração

Criadas automaticamente pelo seed (`prisma/seed.ts`). Senha única: **`bibi123`**
(armazenada com hash **scrypt** — ver `src/lib/password.ts`).

| Portal | URL de login | E-mail | Senha |
|--------|--------------|--------|-------|
| Prestador | `/login` | `dra.helena@bibi.health` | `bibi123` |
| Interno (admin) | `/interno/login` | `faturamento@bibi.health` | `bibi123` |
| Interno (recepção) | `/interno/login` | `recepcao@bibi.health` | `bibi123` |
| Empresa PJ | `/pj/login` | `rh@techcorp.com` | `bibi123` |
| Beneficiário | `/beneficiario/login` | `joao.pereira@email.com` | `bibi123` |

> Cada conta só acessa o portal correspondente ao seu `role`; tentar usar uma
> conta em outro portal retorna erro de acesso.

### Restaurar modo demo

Após testes ou apresentações, um **administrador interno** pode repopular o banco
com a massa original do seed sem redeploy:

1. Login em `/interno/login` com conta **ADMIN** (ex.: `faturamento@bibi.health`).
2. Acesse `/interno/seguranca` → card **“Modo demo — restaurar dados”**.
3. Digite `RESTAURAR` e confirme.

A operação executa `runDatabaseSeed()` (mesmo fluxo de `npm run db:seed`): apaga
todos os registros e recria tenants, empresas, beneficiários e fluxos demo.
A sessão atual é encerrada — faça login novamente (IDs são recriados).

| Ambiente | Habilitado por padrão? | Como ligar |
|----------|------------------------|------------|
| `development` / preview | Sim | — |
| `production` | Não | `ALLOW_DEMO_RESET=true` no painel Netlify |

> **CLI equivalente:** `npm run db:reset` (dev) ou `npm run db:push && npm run db:seed`.
> Detalhes do fluxo: [`docs/FLUXOS.md`](docs/FLUXOS.md) §2.3.

## 7. Fluxo end-to-end (Pay Per Use)

1. **Prestador** faz login em `/login` e vê a **agenda do dia**.
2. Abre um atendimento e **registra os procedimentos utilizados** — o preço é
   calculado com a precificação dinâmica e congelado no uso.
3. Registra a evolução no **prontuário eletrônico (PEP)** e marca o atendimento
   como **REALIZADO**.
4. **Interno** faz login em `/interno/login`, vê os **procedimentos pendentes de
   faturamento** agrupados por beneficiário e **gera a fatura** (Pay Per Use).
5. **Cobrança (Tier 1):** gera **PIX mock**, marca fatura **PAGA** ou o **beneficiário**
   paga em `/beneficiario`. Cobranças de **assinatura** podem virar fatura via bridge.
6. **Empresa (PJ)** acompanha em `/pj` o **consumo dos beneficiários**, assinaturas
   e export CSV. **Webhooks B2B** disparam em eventos-chave (Tier 3).
7. **Beneficiário** agenda consultas, acompanha consumo e paga faturas em self-service.

Diagrama completo com sequência cross-portal: [`docs/FLUXOS.md`](docs/FLUXOS.md) §7.

Exemplo de precificação dinâmica do seed: a Consulta Clínica (base R$ 180,00)
para um beneficiário da **TechCorp** é cobrada por **R$ 153,00** (desconto
corporativo de 15%).

## 8. Modelo de dados

Definido em [`prisma/schema.prisma`](prisma/schema.prisma). Principais entidades:

| Modelo | Descrição |
|--------|-----------|
| `Tenant` | Cliente do SaaS (clínica/hospital). Base do multi-tenancy. |
| `TenantBranding` | White label: cores, logo, `colorScheme`, `customDomain`. |
| `User` | Usuário; `role` define o portal; `internoProfile` (RBAC); MFA TOTP. |
| `Company` | Empresa contratante (PJ). |
| `Patient` | Beneficiário/paciente; `consentAt` (LGPD). |
| `Procedure` | Catálogo de procedimentos com preço base e `tissCode` (TISS). |
| `PricingRule` | Precificação dinâmica (multiplicador por empresa). |
| `Appointment` | Agendamento; `modality` PRESENCIAL/TELE + `telemedicineUrl`. |
| `ProcedureUsage` | **Uso efetivo de procedimento — núcleo do Pay Per Use** (preço congelado). |
| `MedicalRecord` | Prontuário eletrônico (PEP) com `recordType` e templates. |
| `Invoice` / `InvoiceItem` | Fatura; item via `usageId` (Pay Per Use) ou `subscriptionChargeId`. |
| `Payment` | Histórico de pagamento (PIX pendente/confirmado, manual). |
| `Subscription` | Assinatura recorrente (ciclo + valor por beneficiário/empresa). |
| `SubscriptionCharge` | Cobrança futura gerada a partir de uma assinatura. |
| `Message` | Comunicação outbound enfileirada ou enviada (e-mail, SMS, WhatsApp). |
| `TimelineEvent` | Auditoria universal de eventos (Timeline). |
| `WebhookEndpoint` / `WebhookDelivery` | Webhooks B2B outbound com log e retry. |

> SQLite não suporta enums no Prisma; os campos `role`, `status` e `category` são
> `String` com valores documentados no schema.

### Diagrama de relacionamento (simplificado)

```
Tenant 1─┬─* User ───* Appointment ───* ProcedureUsage ──1 InvoiceItem
         ├─* Company ─* Patient ──┘                  └─* (Procedure)
         ├─* Procedure ─* PricingRule
         └─* Invoice ─* InvoiceItem
```

## 9. Referência da API

Todas as rotas vivem em `src/app/api/**` e exigem sessão válida (exceto login).
Erros retornam `{ "error": "mensagem" }` com o status HTTP adequado
(`401` não autenticado, `403` portal/role incorreto, `400` dados inválidos).

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/auth/login` | Login. Body: `{ email, password, portal }`. Suporta MFA em 2 etapas. |
| `POST` | `/api/auth/logout` | Encerra a sessão. |
| `GET` | `/api/auth/me` | Retorna o usuário da sessão atual. |
| `GET` | `/api/auth/mfa/setup` | Gera secret TOTP e QR (INTERNO). |
| `POST` | `/api/auth/mfa/setup` | Habilita MFA após validar código. |
| `POST` | `/api/auth/mfa/verify` | Segunda etapa do login quando MFA ativo. |

### Portal do Prestador (`role: PRESTADOR`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/prestador/agenda` | Agenda do dia do prestador logado. |
| `GET` | `/api/prestador/appointments/{id}` | Detalhe do atendimento (procedimentos + PEP). |
| `PATCH` | `/api/prestador/appointments/{id}` | Atualiza o status. Body: `{ status }`. |
| `POST` | `/api/prestador/appointments/{id}/procedures` | Registra um procedimento (Pay Per Use). Body: `{ procedureId }`. |
| `POST` | `/api/prestador/records` | Adiciona anotação ao PEP. Body: `{ patientId, appointmentId?, content, recordType?, title? }`. |
| `GET` | `/api/procedures` | Catálogo de procedimentos (também acessível ao `INTERNO`). |

### Portal Interno (`role: INTERNO`)

> Rotas sensíveis respeitam **RBAC** via `internoProfile` (ADMIN, FATURAMENTO, RECEPCAO, READONLY).

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/interno/dashboard` | **Dashboard Executivo** — KPIs consolidados. |
| `GET` | `/api/interno/billing` | Procedimentos pendentes e faturas emitidas. |
| `POST` | `/api/interno/invoices` | Gera fatura Pay Per Use. Body: `{ patientId }`. |
| `POST` | `/api/interno/invoices/{id}/pay` | Marca fatura como PAGA (manual). |
| `POST` | `/api/interno/invoices/{id}/pix` | Gera cobrança PIX mock. |
| `POST` | `/api/interno/invoices/{id}/confirm-pix` | Confirma pagamento PIX pendente. |
| `GET` | `/api/interno/invoices/{id}/tiss` | Exporta guia TISS/ANS em XML. |
| `GET` | `/api/interno/patients` | Lista beneficiários. |
| `POST` | `/api/interno/patients` | Cria beneficiário. |
| `PATCH` | `/api/interno/patients/{id}` | Atualiza beneficiário. |
| `GET` | `/api/interno/patients/{id}/overview` | Visão **Cliente 360°**. |
| `GET` | `/api/interno/patients/{id}/export` | Export JSON LGPD. |
| `GET/POST` | `/api/interno/companies` | CRUD empresas. |
| `PATCH` | `/api/interno/companies/{id}` | Atualiza empresa. |
| `GET/POST` | `/api/interno/procedures` | CRUD procedimentos. |
| `PUT/DELETE` | `/api/interno/procedures/{id}` | Atualiza/remove procedimento. |
| `GET/POST` | `/api/interno/users` | CRUD usuários internos/prestadores. |
| `PATCH` | `/api/interno/users/{id}` | Atualiza usuário. |
| `GET/POST` | `/api/interno/appointments` | Agenda interna. |
| `PATCH` | `/api/interno/appointments/{id}` | Altera status/modalidade. |
| `GET` | `/api/interno/reports?type=billing\|crm` | Download CSV. |
| `GET` | `/api/interno/crm/pipeline` | Pipeline CRM. |
| `PATCH` | `/api/interno/companies/{id}/status` | Atualiza status CRM. |
| `GET/POST` | `/api/interno/subscriptions` | Assinaturas recorrentes. |
| `POST` | `/api/interno/subscriptions/charges/{chargeId}/invoice` | Bridge cobrança → fatura. |
| `GET/POST` | `/api/interno/messages` | Fila de comunicação. |
| `POST` | `/api/interno/reminders` | Lembretes automáticos + dispatch. |
| `GET/PUT` | `/api/interno/branding` | White label do tenant. |
| `GET/POST` | `/api/interno/webhooks` | Webhooks B2B. |
| `GET` | `/api/interno/webhooks/deliveries` | Log de entregas. |
| `POST` | `/api/interno/webhooks/deliveries/{id}/retry` | Retry manual. |

### Jobs agendados (cron)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/cron/reminders` | Lembretes de consulta/fatura/assinatura. Header: `x-cron-secret`. |
| `POST` | `/api/cron/webhooks` | Retry de webhooks com backoff. Header: `x-cron-secret`. |

### Portal do Beneficiário (`role: BENEFICIARIO`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/beneficiario/overview` | Self-service: agenda, consumo, faturas, assinatura e PEP. |
| `GET` | `/api/beneficiario/providers` | Prestadores disponíveis para agendamento. |
| `GET` | `/api/beneficiario/slots` | Slots de 30 min (query: `providerId`, `date`). |
| `POST` | `/api/beneficiario/appointments` | Agenda consulta self-service. |
| `POST` | `/api/beneficiario/invoices/{id}/pay` | Gera PIX para fatura. |
| `PATCH` | `/api/beneficiario/invoices/{id}/pay` | Confirma pagamento PIX. |

### Portal da Empresa (`role: PJ`)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/pj/overview` | Contrato, beneficiários, faturas, alertas e MRR. |
| `GET` | `/api/pj/reports` | Export CSV corporativo. |

### Documentação interativa (Swagger UI)

Com o servidor rodando, explore e teste a API direto do navegador:

- **Swagger UI:** http://localhost:3000/api-docs.html
- **Especificação OpenAPI 3.0 (YAML):** http://localhost:3000/openapi.yaml
  (fonte em [`public/openapi.yaml`](public/openapi.yaml))

### Exemplo com `curl`

```bash
# 1) Login (salva o cookie de sessão)
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dra.helena@bibi.health","password":"bibi123","portal":"prestador"}'

# 2) Agenda do dia
curl -b cookies.txt http://localhost:3000/api/prestador/agenda
```

## 10. Estrutura de pastas

```
sistema-bibi/
├── prisma/
│   ├── schema.prisma        # modelo de dados (multi-tenant + Pay Per Use)
│   └── seed.ts              # dados de demonstração
├── src/
│   ├── app/
│   │   ├── api/             # Route Handlers (backend)
│   │   │   ├── auth/        # login, logout, me, MFA
│   │   │   ├── prestador/   # agenda, atendimentos, procedimentos, PEP
│   │   │   ├── interno/     # billing, cadastros, agenda, webhooks, TISS…
│   │   │   ├── beneficiario/  # overview, agendamento, PIX
│   │   │   ├── pj/          # overview, reports
│   │   │   ├── cron/        # reminders, webhooks retry
│   │   │   └── procedures/  # catálogo
│   │   ├── login/           # /login (Prestador)
│   │   ├── interno/         # dashboard, faturamento, cadastros, integrações…
│   │   ├── beneficiario/    # /beneficiario e /beneficiario/login
│   │   ├── pj/              # /pj e /pj/login
│   │   ├── prestador/       # /prestador e /prestador/atendimento/[id]
│   │   ├── layout.tsx       # layout raiz (pt-BR)
│   │   └── page.tsx         # landing page
│   ├── components/          # componentes de cliente (views/forms)
│   ├── lib/                 # db, sessão, invoice-service, webhooks, MFA…
│   └── proxy.ts             # proteção de rotas (Next 16 "Proxy")
├── .env.example
└── README.md
```

## 11. Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento (http://localhost:3000). |
| `npm run build` | Build de produção (inclui verificação de tipos). |
| `npm run start` | Sobe o build de produção. |
| `npm run lint` | ESLint. |
| `npm run test` | Vitest — unitário, segurança, integração e API. |
| `npm run test:watch` | Vitest em modo watch. |
| `npm run test:e2e` | Playwright — fluxos E2E no browser. |
| `npm run db:push` | Sincroniza o schema com o banco SQLite. |
| `npm run db:seed` | Popula o banco com os dados de demonstração. |
| `npm run build:netlify` | Pipeline de build da Netlify (`db:push` + seed + `next build`). |
| `npm run netlify:build` | Alias de `build:netlify` — validar localmente sem publicar. |
| `npm run netlify:dev` | `netlify dev` — emula Netlify na porta 8888. |

## 12. Segurança e LGPD

- Sessão por **cookie httpOnly** assinado com **HMAC-SHA256** (`SESSION_SECRET`),
  com comparação em tempo constante na verificação.
- **Segregação por `role` e RBAC interno** (`internoProfile`): cada portal valida
  o perfil no `proxy.ts` (checagem otimista) e no servidor (HMAC + permissões).
- **MFA TOTP** opcional para usuários internos (`/interno/seguranca`).
- **Restauração demo** (ADMIN): repopula o seed via UI; desligada em produção
  por padrão (`ALLOW_DEMO_RESET`).
- **LGPD light:** consentimento no cadastro + export JSON por beneficiário.
- Dados sensíveis (prontuário, beneficiários) ficam isolados por `tenant`.

> ⚠️ **POC**: senhas com hash **scrypt** no seed e novos usuários; adapters de
> pagamento/comunicação usam **mock/console** para demonstração. Em produção:
> HTTPS, Postgres, gateways reais, auditoria de acesso e validação XSD TISS.

## 13. Notas técnicas e limitações da POC

- **Prisma fixado na linha 6** de propósito: o Prisma 7 remove `url` do datasource
  e exige *driver adapters* + `prisma.config.ts` (quebraria o schema atual).
- **Middleware virou "Proxy" no Next 16**: a proteção de rotas está em
  `src/proxy.ts` (não há `middleware.ts`).
- `params`, `searchParams` e `cookies()` são **assíncronos** (use `await`).
- Banco **SQLite** local para facilitar o desenvolvimento; o arquivo `dev.db` e o
  `.env` são *gitignored*.
- Testes automatizados com **Vitest** (unitário, integração, API, segurança) e **Playwright** (E2E).
  Ver [`docs/TESTES.md`](docs/TESTES.md) para o mapa completo e lacunas conhecidas.
- **Adapters mock** ativos por padrão (`PAYMENT_GATEWAY=mock`, `COMMUNICATION_PROVIDER=console`).
- **Netlify em produção** — https://sistema-bibi.netlify.app (deploy via CLI validado;
  deploy Git automático ainda com falhas intermitentes — ver
  [`docs/DEPLOY_NETLIFY.md`](docs/DEPLOY_NETLIFY.md) e
  [`docs/HISTORICO_2026-06-21.md`](docs/HISTORICO_2026-06-21.md)).
  Build local: `npm run netlify:build`.
- **Roadmap (Tier 5+):** SSO OAuth/SAML, Postgres produção, validação XSD TISS completa.

## 14. Documentação adicional

- **Fluxos de usuário e negócio (com diagramas Mermaid):**
  [`docs/FLUXOS.md`](docs/FLUXOS.md)
- **Ações × Benchmark (Bibi vs iClinic/Feegow/ERPMed):**
  [`docs/BENCHMARK.md`](docs/BENCHMARK.md)
- **Arquitetura e diagramas** (componentes, ER e fluxos Mermaid):
  [`docs/ARQUITETURA.md`](docs/ARQUITETURA.md)
- **Motor de cobrança** (contratos PIX/boleto/cartão, Strategy Pattern):
  [`docs/PAYMENTS.md`](docs/PAYMENTS.md)
- **Motor de comunicação** (e-mail, SMS, WhatsApp, fila de mensagens):
  [`docs/COMMUNICATIONS.md`](docs/COMMUNICATIONS.md)
- **Design system e white label:** [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md)
- **Base de conhecimento (NotebookLM / RAG):**
  [`docs/NOTEBOOKLM.md`](docs/NOTEBOOKLM.md)
- **Deploy Netlify (produção + troubleshooting):**
  [`docs/DEPLOY_NETLIFY.md`](docs/DEPLOY_NETLIFY.md)
- **Histórico do dia 21/06/2026** (PRs, deploys, commits):
  [`docs/HISTORICO_2026-06-21.md`](docs/HISTORICO_2026-06-21.md)
- **Evidências visuais dos fluxos** (vídeos e screenshots):
  [`docs/evidencias/README.md`](docs/evidencias/README.md)
- **API interativa (Swagger UI):** http://localhost:3000/api-docs.html
- **Especificação OpenAPI:** [`public/openapi.yaml`](public/openapi.yaml)

---

Construído como POC para validar o modelo de negócio do **Sistema Bibi**.
