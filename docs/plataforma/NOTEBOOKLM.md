# Sistema Bibi - ServiceOS v2.0 — Base de Conhecimento (NotebookLM)

Documento consolidado para ingestão em ferramentas de RAG (NotebookLM, etc.).
Última atualização: reflete **ServiceOS v2.0** (multi-nicho), **white label** (tema escuro, logos Blobs),
**design system semântico**, Tiers 1–4 e fluxos em [`../produto/FLUXOS.md`](../produto/FLUXOS.md).

---

## 1. O que é o Sistema Bibi - ServiceOS

Infraestrutura **SaaS multi-tenant multi-segmento** (ServiceOS v2.0). Cada operação é um **tenant**
com `niche` e `labels` (JSON) para tradução automática da UI. Núcleo: **Pay Per Use** sobre qualquer
serviço — consulta médica, hora jurídica, banho e tosa — com **precificação dinâmica** por empresa.

**ROI de referência:** 500 colaboradores — ~R$ 175k/mês (tradicional) → ~R$ 23,4k/mês (Pay Per Use) = **~87% economia**. Detalhes: [`ROI_REFERENCIA.md`](ROI_REFERENCIA.md).

**Stack:** Next.js 16 (App Router + `proxy.ts`), React 19, TypeScript, Tailwind v4, Prisma 6, SQLite (dev), Netlify Blobs (logos).

**Arquitetura v2.0:** [`../versoes/V2_0.md`](../versoes/V2_0.md) · [`../versoes/V2_0_ARCHITECTURE.md`](../versoes/V2_0_ARCHITECTURE.md). Operações: [`OPERACOES.md`](OPERACOES.md).

---

## 2. Quatro portais segregados por role

| Portal | Login | Dashboard | Role | Público |
|--------|-------|-----------|------|---------|
| Prestador | `/login` | `/prestador` | `PRESTADOR` | Médicos / profissionais |
| Interno | `/interno/login` | `/interno/dashboard` | `INTERNO` | Equipe administrativa |
| Empresa PJ | `/pj/login` | `/pj` | `PJ` | RH / gestores corporativos |
| Beneficiário | `/beneficiario/login` | `/beneficiario` | `BENEFICIARIO` | Pacientes (self-service) |

**Senha demo (todos):** `bibi123` (armazenada com hash scrypt no seed — ver §4)

| Portal | E-mail |
|--------|--------|
| Prestador | `dra.helena@bibi.health` |
| Interno (admin) | `faturamento@bibi.health` |
| Interno (recepção) | `recepcao@bibi.health` |
| PJ | `rh@techcorp.com` |
| Beneficiário | `joao.pereira@email.com` |
| Beneficiário (particular) | `pedro.almeida@email.com` |

### Tenants ServiceOS multi-nicho (v2.0)

Senha **`bibi123`**. Landing preview: `/?niche=VET`, `/?niche=LEGAL`, etc.

| Nicho | Tenant | Login interno |
|-------|--------|---------------|
| VET | PetCare | `operacao@petcare.demo` |
| DENTAL | Smile Odonto | `operacao@smile.demo` |
| LEGAL | Lex & Partners | `operacao@lex.demo` |
| SPA | Zen Studio | `operacao@zen.demo` |
| EDUCATION | EduPrime | `operacao@eduprime.demo` |

Escopo: [`V2_0.md`](V2_0.md). Labels: `useLabels()` — nunca hardcodar "Paciente" em novas telas.

---

## 3. Setup local

```bash
npm install
cp .env.example .env          # se não existir
npm run db:push && npm run db:seed
npm run dev                   # http://localhost:3000
```

Variáveis `.env`:

| Variável | Descrição |
|----------|-----------|
| `DATABASE_URL` | SQLite (padrão `file:./dev.db`) |
| `SESSION_SECRET` | HMAC do cookie de sessão |
| `PAYMENT_GATEWAY` | `mock` (POC) ou `asaas`/`efi`/`inter` — Tier 1 |
| `COMMUNICATION_PROVIDER` | `console` (POC) ou `sendgrid`/`twilio`/`meta` — Tier 1 |
| `CRON_SECRET` | Protege `POST /api/cron/reminders` e `/api/cron/webhooks` |
| `TELEMEDICINE_BASE_URL` | Base das salas virtuais mock — Tier 4 |

Scripts úteis: `npm run db:reset`, `npm run netlify:build`, `npm run lint`.

---

## 4. Segurança e multi-tenancy

- **Cookie httpOnly** `bibi_session` assinado com HMAC-SHA256 (`src/lib/session.ts`)
- **Proxy otimista** (`src/proxy.ts`) — redireciona ao login se não houver cookie
- **Validação real** em cada página/API via `getSessionUser()` / `requireUser([roles])`
- **Senhas:** hash **scrypt** via `src/lib/password.ts` (seed e novos usuários); login aceita legado texto puro durante migração
- Dados isolados por `tenantId` em todas as queries de negócio
- PJ: escopo por `user.companyId`
- Beneficiário: escopo por `user.patientId` (anti-IDOR — sem ID na URL da API de overview)

---

## 5. Modelo de dados (Prisma)

Entidades principais:

| Modelo | Descrição |
|--------|-----------|
| `Tenant` | Clínica/hospital (SaaS) |
| `TenantBranding` | White label: cores, logo, `colorScheme`, `displayName` |
| `User` | Login; `role`, `internoProfile` (RBAC), MFA; `companyId`/`patientId` |
| `Company` | Empresa contratante; status CRM (LEAD → CANCELADO) |
| `Patient` | Beneficiário/paciente |
| `Procedure` | Catálogo (CONSULTA/EXAME) com preço base |
| `PricingRule` | Multiplicador por empresa (precificação dinâmica) |
| `Appointment` | Agendamento; `modality` PRESENCIAL/TELE + telemedicina |
| `ProcedureUsage` | **Núcleo Pay Per Use** — preço congelado no uso |
| `MedicalRecord` | PEP — `recordType`, `title`, `content` (Tier 2) |
| `Invoice` / `InvoiceItem` | Fatura; item pode ser Pay Per Use (`usageId`) ou assinatura (`subscriptionChargeId`) — Tier 1 |
| `Payment` | Histórico de pagamento (PIX pendente/confirmado, manual) — Tier 1 |
| `Subscription` / `SubscriptionCharge` | Recorrência (PENDENTE/FATURADA/CANCELADA) |
| `Message` | Comunicação outbound (EMAIL/SMS/WHATSAPP) |
| `TimelineEvent` | Auditoria universal |
| `WebhookEndpoint` / `WebhookDelivery` | Webhooks B2B + log/retry — Tier 3/4 |

SQLite não suporta enums Prisma — `role`, `status`, `category` são `String`.

**PEP — tipos de registro (`recordType`):** EVOLUCAO, ANAMNESE, RECEITA, ATESTADO.

---

## 6. Fluxo Pay Per Use (end-to-end)

1. **Prestador** vê agenda em `/prestador`, abre atendimento
2. Registra **procedimentos** — preço calculado com desconto corporativo e congelado
3. Registra **PEP** (template estruturado opcional) e marca atendimento REALIZADO
4. **Interno** vê pendências em `/interno` (faturamento), gera **fatura**
5. **Tier 1:** cobrança PIX, marcar PAGA, bridge assinatura → fatura
6. **PJ** acompanha consumo em `/pj`
7. **Beneficiário** vê consumo transparente e pode **agendar consulta** em `/beneficiario`

Exemplo seed: Consulta Clínica base R$ 320 → TechCorp paga R$ 272 (15% desconto).

---

## 7. Módulos do Portal Interno

| Rota | Módulo | Épico / Tier |
|------|--------|--------------|
| `/interno/dashboard` | Dashboard Executivo (KPIs) | 8 |
| `/interno` | Faturamento Pay Per Use (+ PIX/pagar — Tier 1) | core / T1 |
| `/interno/agenda` | Agendamentos (criar, status) | T2 |
| `/interno/cadastros` | CRUD: beneficiários, empresas, procedimentos, usuários | T2 |
| `/interno/crm` | Pipeline CRM corporativo | 3 |
| `/interno/assinaturas` | Recorrência (+ faturar cobrança — Tier 1) | 5 / T1 |
| `/interno/comunicacao` | Fila de mensagens (+ lembretes automáticos — Tier 1) | 7 / T1 |
| `/interno/relatorios` | Exportação CSV (faturamento, CRM) | T2 |
| `/interno/branding` | White label (cores, logo, tema escuro, domínio custom) | design / T3 |
| `/interno/beneficiarios/[id]` | Cliente 360° | 1 |
| `/interno/integracoes` | Webhooks B2B + log de entregas | T3 / T4 |
| `/interno/seguranca` | MFA TOTP | T4 |

---

## 8. Épicos implementados (1–8)

### Épico 1 — Cliente 360°
- `getPatientOverview()` — consolida paciente, atendimentos, procedimentos, PEP, faturas, timeline
- API: `GET /api/interno/patients/[id]/overview`

### Épico 2 — Timeline Universal
- `TimelineEvent` + `recordTimelineEvent()` em login, atendimento, faturamento, CRM, pagamentos, etc.
- Ações incluem `INVOICE_ISSUED`, `INVOICE_PAID`, `CHARGE_SENT` (Tier 1)
- Visível no Cliente 360° e no portal do beneficiário

### Épico 3 — CRM Corporativo
- `Company.status`: LEAD, PROPOSTA, NEGOCIACAO, ATIVO, INADIMPLENTE, CANCELADO
- API: `GET /api/interno/crm/pipeline`, `PATCH /api/interno/companies/[id]/status`
- CRUD de empresas: `GET/POST /api/interno/companies`, `PATCH /api/interno/companies/[id]` (Tier 2)

### Épico 4 — Motor de Cobrança
- Contratos Strategy: PIX, boleto, cartão (`src/lib/payments/`)
- **Adapter POC:** `MockPixAdapter` (`PAYMENT_GATEWAY=mock`) — Tier 1
- Gateways reais previstos: Asaas, Efí, Banco Inter
- Doc: `docs/plataforma/PAYMENTS.md`
- Serviço: `src/lib/invoice-service.ts` — PIX, marcar PAGA, bridge assinatura (Tier 1)

### Épico 5 — Recorrência
- `Subscription` + `SubscriptionCharge` (PENDENTE/FATURADA/CANCELADA)
- Ciclos: MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL
- API: `/api/interno/subscriptions/**`
- **Tier 1:** `POST /api/interno/subscriptions/charges/[chargeId]/invoice` — cobrança vira fatura

### Épico 6 — Portal Beneficiário
- `User.patientId` vincula login ao `Patient`
- API: `GET /api/beneficiario/overview` (escopo sessão, sem IDOR)
- Self-service: consumo, faturas, assinatura, PEP, timeline
- **Tier 1:** pagar fatura via PIX (`POST/PATCH /api/beneficiario/invoices/[id]/pay`)
- **Tier 2:** agendamento self-service (`GET providers/slots`, `POST appointments`)

### Épico 7 — Comunicação
- `Message` enfileirada (PENDENTE) → dispatch via provider
- Contratos: EMAIL, SMS, WHATSAPP (`src/lib/communications/`)
- **Adapter POC:** `ConsoleEmailAdapter` (`COMMUNICATION_PROVIDER=console`) — Tier 1
- Provedores reais: SendGrid, Twilio, Meta
- Doc: `docs/plataforma/COMMUNICATIONS.md`
- Templates: APPOINTMENT_REMINDER, INVOICE_DUE, SUBSCRIPTION_DUE, GENERIC
- **Tier 1:** `reminder-service.ts` + `POST /api/interno/reminders` + cron `POST /api/cron/reminders`

### Épico 8 — Dashboard Executivo
- `getExecutiveDashboard()` — KPIs: Pay Per Use pendente, MRR, CRM, fila de mensagens, timeline
- API: `GET /api/interno/dashboard`

---

## 9. Tier 1 — Ciclo de receita (PR #17)

Fecha o ciclo financeiro da POC:

| Feature | Descrição |
|---------|-----------|
| Bridge assinatura → fatura | `SubscriptionCharge` vira `Invoice` + status FATURADA |
| Marcar fatura PAGA | Modelo `Payment` + timeline `INVOICE_PAID` |
| PIX mock | Gerar QR/copia-e-cola, confirmar pagamento (interno e beneficiário) |
| Comunicação real (POC) | Dispatch via console adapter |
| Lembretes automáticos | Consultas 24h, assinatura 3 dias, Pay Per Use pendente |

**APIs principais:**
- `POST /api/interno/subscriptions/charges/[chargeId]/invoice`
- `POST /api/interno/invoices/[id]/pay` — marcar manual
- `POST /api/interno/invoices/[id]/pix` — gerar PIX
- `POST /api/interno/invoices/[id]/confirm-pix`
- `POST /api/beneficiario/invoices/[id]/pay` — PIX beneficiário
- `POST /api/interno/reminders` — lembretes + auto-dispatch
- `POST /api/cron/reminders` — job agendado (header `x-cron-secret`)

---

## 10. Tier 2 — Operação table stakes (PR #18)

Alinha com iClinic/Feegow no dia a dia:

| Feature | Descrição |
|---------|-----------|
| CRUD Admin | Beneficiários, empresas, procedimentos, usuários (`/interno/cadastros`) |
| Agenda interna | Criar/reagendar, alterar status (`/interno/agenda`) |
| Agendamento self-service | Beneficiário escolhe prestador + slot 30min (8h–18h) |
| Relatórios CSV | Faturamento + CRM (`/interno/relatorios`) |
| PEP estruturado | Templates SOAP, anamnese, receita, atestado |
| Hash de senha | scrypt em seed, login e criação de usuários |

**APIs principais:**
- `GET/POST /api/interno/patients`, `PATCH /api/interno/patients/[id]`
- `GET/POST /api/interno/companies`, `PATCH /api/interno/companies/[id]`
- `GET/POST /api/interno/procedures`, `PUT/DELETE /api/interno/procedures/[id]`
- `GET/POST /api/interno/users`, `PATCH /api/interno/users/[id]`
- `GET/POST /api/interno/appointments`, `PATCH /api/interno/appointments/[id]`
- `GET /api/interno/reports?type=billing|crm` — download CSV
- `GET /api/beneficiario/providers`, `GET /api/beneficiario/slots`, `POST /api/beneficiario/appointments`

**Serviços:** `patient-service`, `company-service`, `procedure-service`, `user-service`, `appointment-service`, `scheduling-service`, `pep-templates`.

---

## 11. Tier 3 — B2B, RBAC e integrações

| Feature | Descrição |
|---------|-----------|
| RBAC interno | `internoProfile`: ADMIN, FATURAMENTO, RECEPCAO, READONLY — nav e APIs filtrados |
| Webhooks outbound | CRUD em `/interno/integracoes` — eventos com HMAC SHA-256 |
| Portal PJ completo | Alertas, assinaturas, MRR, export CSV (`/api/pj/reports`) |
| Domínio custom | `TenantBranding.customDomain` + verificação manual (POC) |
| LGPD light | `consentAt` no cadastro + export JSON (`/api/interno/patients/[id]/export`) |

**Eventos webhook:** `INVOICE_ISSUED`, `APPOINTMENT_CREATED`, `COMPANY_STATUS_CHANGED`, `PATIENT_CREATED`

**APIs principais:**
- `GET/POST /api/interno/webhooks`, `PATCH/DELETE /api/interno/webhooks/[id]`
- `GET /api/pj/overview` — overview enriquecido via `pj-portal-service`
- `GET /api/pj/reports` — CSV corporativo
- `GET /api/interno/patients/[id]/export` — JSON LGPD
- `PUT /api/interno/branding` — inclui `customDomain` e `verifyCustomDomain`

**Credencial demo RBAC:** `recepcao@bibi.health` / `bibi123` (perfil RECEPCAO — sem faturamento/branding)

---

## 12. KPIs do Dashboard Executivo

| KPI | Fonte |
|-----|-------|
| Pendente Pay Per Use | `ProcedureUsage` com `billed=false` |
| Total faturado | Soma de `Invoice.total` |
| MRR estimado | Assinaturas ATIVA normalizadas para mensal |
| Atendimentos hoje | `Appointment` do dia |
| Pipeline CRM | Contagem de `Company` por status |
| Mensagens na fila | `Message` com status PENDENTE |
| Atividade recente | Últimos 10 `TimelineEvent` |

---

## 13. API REST (resumo)

Base: `http://localhost:3000/api`

**Auth:** `POST /auth/login` body `{ email, password, portal }` — portal: `prestador|interno|pj|beneficiario`

**Prestador:** agenda, atendimentos, procedimentos, PEP (com `recordType`)

**Interno:** dashboard, billing, invoices, cadastros (patients/companies/procedures/users), appointments, reports, crm, subscriptions, messages, branding

**Beneficiário:** overview, providers, slots, appointments (agendar), invoices/pay (Tier 1)

**PJ:** overview enriquecido, export CSV (`/api/pj/reports`)

OpenAPI completa: `public/openapi.yaml` — Swagger UI em `/api-docs.html`

---

## 14. Arquivos-chave do código

```
src/
├── proxy.ts                    # Proteção de rotas (Next 16)
├── lib/
│   ├── session.ts              # Cookie HMAC
│   ├── password.ts             # Hash scrypt (Tier 2)
│   ├── api-auth.ts             # requireUser, requireBeneficiary
│   ├── roles.ts                # PORTALS e ROLES
│   ├── pricing.ts              # Pay Per Use + tenant scope
│   ├── interno-permissions.ts  # RBAC portal interno (Tier 3)
│   ├── interno-guard.ts        # Proteção páginas interno (Tier 3)
│   ├── webhook-service.ts      # Webhooks B2B (Tier 3)
│   ├── pj-portal-service.ts    # Portal PJ enriquecido (Tier 3)
│   ├── patient-export.ts       # Export LGPD (Tier 3)
│   ├── tenant-resolver.ts      # Domínio custom white label (Tier 3)
│   ├── patient-overview.ts     # Cliente 360°
│   ├── patient-service.ts      # CRUD beneficiários (Tier 2)
│   ├── company-service.ts      # CRUD empresas (Tier 2)
│   ├── procedure-service.ts    # CRUD procedimentos (Tier 2)
│   ├── user-service.ts         # CRUD usuários (Tier 2)
│   ├── appointment-service.ts  # Agenda (Tier 2)
│   ├── scheduling-service.ts   # Slots self-service (Tier 2)
│   ├── invoice-service.ts      # PIX, pagamento, bridge assinatura (Tier 1)
│   ├── reminder-service.ts     # Lembretes automáticos (Tier 1)
│   ├── pep-templates.ts        # Templates PEP (Tier 2)
│   ├── reports/billing-report.ts # CSV (Tier 2)
│   ├── beneficiary-overview.ts # Self-service
│   ├── executive-dashboard.ts  # KPIs
│   ├── timeline.ts             # Auditoria
│   ├── subscription*.ts        # Recorrência
│   ├── message*.ts             # Comunicação
│   ├── theme/                  # Design system + branding
│   ├── payments/               # Motor cobrança + MockPixAdapter (Tier 1)
│   └── communications/         # Motor comunicação + ConsoleAdapter (Tier 1)
├── app/
│   ├── api/                    # Route Handlers
│   ├── interno/                # Portal interno (10+ rotas)
│   ├── prestador/              # Portal prestador
│   ├── pj/                     # Portal empresa
│   └── beneficiario/           # Portal beneficiário
└── components/
    ├── ui/                     # Design system (Button, Card, Badge…)
    ├── layout/                 # PortalShell, TenantTheme, PageHeader
    ├── CadastrosView.tsx       # Tier 2
    ├── AppointmentsView.tsx    # Tier 2
    ├── ReportsView.tsx         # Tier 2
    ├── IntegracoesView.tsx     # Tier 3
    └── …                       # BillingView, BrandingView, PjView, etc.
```

---

## 15. Dados de demonstração (seed)

**Tenants:** Clínica Horizonte (teal) + VitaCare demo (white label azul)

**Empresa ativa:** TechCorp Benefícios LTDA (desconto 15% consulta clínica)

**Beneficiários:**
- João Pereira (TechCorp) — atendimento hoje, 2 procedimentos pendentes, assinatura mensal
- Maria Souza (TechCorp) — hemograma pendente, assinatura trimestral
- Pedro Almeida (particular) — login `pedro.almeida@email.com`; fatura PAGA histórica, assinatura suspensa; walk-in demo em `/interno/agenda`

**CRM:** 6 empresas em estágios diversos (LEAD a CANCELADO)

**Comunicação:** 2 mensagens PENDENTE (WhatsApp João, e-mail Maria)

**Integrações:** webhook demo ERP TechCorp (`/interno/integracoes`)

**RBAC:** usuário recepção `recepcao@bibi.health` (perfil RECEPCAO)

**Prestador:** Dra. Helena — agenda do dia com atendimentos seed

---

## 16. Limitações da POC

- SQLite local — migrar para Postgres em produção (Netlify Database)
- Prisma fixado na v6 (v7 quebra schema atual)
- Adapters reais (Asaas, SendGrid) não incluídos — POC usa `mock` e `console`
- Deploy Netlify — **pacotes fechados** (não deploy a cada merge). Produção:
  https://sistema-bibi.netlify.app (`docs/plataforma/DEPLOY_NETLIFY.md`, `docs/versoes/RELEASES.md`, `docs/plataforma/OPERACOES.md`).
  Validar local: `npm run pre-release`. Publicar: `npx netlify deploy --prod` (manual).
  Pode retornar **503 `usage_exceeded`** (cota Netlify — não é bug de código).
- SSO OAuth/SAML ainda não implementados (MFA TOTP disponível — Tier 4)
- Validação XSD TISS completa pendente (export XML mock — Tier 4)
- Verificação de domínio custom é manual na POC (sem challenge DNS automático)

---

## 17. Documentação complementar

| Documento | Conteúdo |
|-----------|----------|
| `docs/README.md` | Índice da documentação por segmento |
| `docs/segmentos/README.md` | Segmentos ServiceOS v2.0 |
| `docs/produto/FLUXOS.md` | Fluxos de usuário e negócio (todos os portais) |
| `docs/produto/JORNADA_CLIENTE.md` | Jornada UX nos 4 portais, gaps e backlog priorizado |
| `docs/plataforma/BENCHMARK.md` | Matriz Ações × Benchmark (iClinic, Feegow, ERPMed) |
| `docs/plataforma/ARQUITETURA.md` | Diagramas Mermaid, épicos, checklists |
| `docs/plataforma/PAYMENTS.md` | Motor de cobrança Strategy |
| `docs/plataforma/COMMUNICATIONS.md` | Motor de comunicação Strategy |
| `docs/plataforma/DESIGN_SYSTEM.md` | Design system, tokens CSS e white label |
| `docs/plataforma/DEPLOY_NETLIFY.md` | Deploy Netlify (produção + troubleshooting) |
| `docs/versoes/RELEASES.md` | Pacotes fechados — o que está em produção vs pendente |
| `docs/plataforma/WORKFLOW_CURSOR.md` | Workflow Cursor sem deploy automático |
| `docs/plataforma/OPERACOES.md` | Mapa completo de operações + regras para agentes IA |
| `docs/plataforma/HISTORICO_2026-06-21.md` | Auditoria PRs, commits e deploys do dia |
| `.cursor/rules/operacoes-bibi.mdc` | Regras core (always apply) |
| `.cursor/rules/netlify-release.mdc` | Deploy/release (ativação inteligente) |
| `.cursor/rules/stack-nextjs.mdc` | Stack e código (`src/**`) |
| `docs/evidencias/README.md` | Vídeos e screenshots dos fluxos funcionais |
| `public/openapi.yaml` | Especificação API |
| `AGENTS.md` | Instruções para agentes de IA |

---

## 18. Perguntas frequentes (FAQ)

**Como faço login no portal interno?**
→ `/interno/login` com `faturamento@bibi.health` / `bibi123`. Após login, vai para `/interno/dashboard`.

**Onde cadastro um novo beneficiário?**
→ `/interno/cadastros` → aba Beneficiários (Tier 2).

**Como o beneficiário agenda consulta sozinho?**
→ `/beneficiario` → seção "Agendar consulta" → prestador, data, horário (Tier 2).

**Onde vejo o consumo de um beneficiário?**
→ Portal Interno: Cliente 360° em `/interno/beneficiarios/[id]`. Beneficiário: `/beneficiario`.

**Como funciona o desconto corporativo?**
→ `PricingRule` com `multiplier` (ex.: 0.85 = 15% desconto) por `procedureId` + `companyId`.

**Como faturar uma cobrança de assinatura?**
→ `/interno/assinaturas` → Ver cobranças → **Faturar** (Tier 1).

**Como marcar fatura como paga ou gerar PIX?**
→ `/interno` (Faturamento) → coluna **Ações** na tabela de faturas: botões **PIX** e **Marcar paga** (Tier 1). Beneficiário paga em `/beneficiario`.

**Onde está o fluxo completo do sistema?**
→ [`../produto/FLUXOS.md`](../produto/FLUXOS.md) — diagramas Mermaid, RBAC, máquinas de estado e Pay Per Use E2E.

**Por que dispatch de mensagem falha?**
→ Configure `COMMUNICATION_PROVIDER=console` (POC) ou registre adapter real (SendGrid, etc.).

**Como exportar relatórios?**
→ `/interno/relatorios` → download CSV faturamento ou CRM (Tier 2).

**Como usar templates no prontuário?**
→ Prestador → atendimento → PEP → escolher tipo → **Usar template** (Tier 2).

**Como exportar dados LGPD de um beneficiário?**
→ Cliente 360° → link **Exportar dados (LGPD JSON)** ou `GET /api/interno/patients/[id]/export` (Tier 3).

**Como configurar webhooks para parceiros B2B?**
→ `/interno/integracoes` — cadastre URL, eventos e secret HMAC (Tier 3).

**O que o usuário de recepção pode acessar?**
→ Login com `recepcao@bibi.health` — dashboard, agenda, cadastros e comunicação (RBAC Tier 3).

**Como habilitar MFA no portal interno?**
→ `/interno/seguranca` — escaneie QR TOTP, valide código e habilite (Tier 4).

**Como exportar guia TISS de uma fatura?**
→ Faturamento → botão TISS ou `GET /api/interno/invoices/[id]/tiss` (Tier 4).

**Como funciona telemedicina na agenda?**
→ Agendamento com `modality=TELE` gera link mock (`TELEMEDICINE_BASE_URL`) visível em prestador/beneficiário (Tier 4).

**Qual a diferença entre faturamento e dashboard?**
→ `/interno` = operação (gerar faturas, PIX). `/interno/dashboard` = visão executiva (KPIs).

**Como valido um pacote antes de publicar na Netlify?**
→ `npm run pre-release` (lint + build Netlify local, sem publicar). Ver `docs/plataforma/OPERACOES.md`.

**Por que produção retorna 503?**
→ Se o corpo for `usage_exceeded`, a cota Netlify esgotou — não é bug. Dev local continua normal.

**Como publico em produção?**
→ Após `npm run pre-release`: `npx netlify deploy --prod --no-build` (manual). Atualizar `docs/versoes/RELEASES.md`. O `--no-build` economiza cota Netlify.

**Agentes Cursor podem fazer deploy?**
→ Não, salvo pedido explícito. Regras em `AGENTS.md` e `.cursor/rules/operacoes-bibi.mdc`.

---

## 19. Design system e white label

- **Tokens CSS** em `src/app/globals.css` (`--brand-*`, `--surface-*`, `--status-*`, dark mode).
- **Modelo `TenantBranding`**: `displayName`, cores hex, `logoUrl`, `platformLabel`, `colorScheme`, `customDomain`.
- **Componentes UI** em `src/components/ui/` (`Button`, `Input`, `Card`, `Badge`, `Alert`, `NavTabs`, `StatusBadge`).
- **Layout**: `PortalShell`, `PageHeader`, `TenantTheme` (injeta CSS variables por tenant/portal).
- **Sessão**: `getSessionUser()` retorna `user.branding` após login.
- Seed inclui tenant demo **VitaCare** (azul) além da **Clínica Horizonte** (teal).
- **Admin branding:** `/interno/branding` — CRUD visual, presets e upload de logo (Netlify Blobs).
- Logos servidos em `/api/branding/logo/[tenantId]` com `Cache-Tag` para purge CDN.
- **Tema escuro por tenant:** `colorScheme` (`light` | `dark` | `system`).
- Ver `docs/plataforma/DESIGN_SYSTEM.md`.

---

## 20. Tier 4 — Enterprise (MFA, TISS, telemedicina, webhook retry)

| Feature | Descrição |
|---------|-----------|
| MFA TOTP | `/interno/seguranca` — setup/enable/disable; login em 2 etapas |
| Webhook log + retry | Log de entregas, backoff exponencial, cron `POST /api/cron/webhooks` |
| Telemedicina | `modality` PRESENCIAL/TELE + link mock da sala virtual |
| Guia TISS/ANS | Export XML simplificado por fatura (`GET /api/interno/invoices/[id]/tiss`) |

**APIs principais:**
- `GET/POST /api/auth/mfa/setup`, `POST /api/auth/mfa/verify`
- `GET /api/interno/webhooks/deliveries`, `POST .../deliveries/[id]/retry`
- `POST /api/cron/webhooks` (header `x-cron-secret`)
- `GET /api/interno/invoices/[id]/tiss`

---

## 21. Roadmap sugerido (Tier 5+)

| Prioridade | Feature |
|------------|---------|
| Tier 5 | SSO OAuth/SAML, Postgres produção, TISS validação XSD |
| Estratégico | Telemedicina integrada (Twilio/Whereby), ANS operadora |

---

*Fim do documento — Sistema Bibi - ServiceOS v2.0 (corpus RAG)*
