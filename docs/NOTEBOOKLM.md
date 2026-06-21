# Sistema Bibi — Base de Conhecimento (NotebookLM)

Documento consolidado para ingestão em ferramentas de RAG (NotebookLM, etc.).
Última atualização: reflete os 8 épicos da evolução comercial da POC.

---

## 1. O que é o Sistema Bibi

POC de plataforma **SaaS HealthTech multi-tenant** inspirada no modelo ERPMed/Centtralmed.
Cada clínica/hospital é um **tenant**. O núcleo de negócio é **Pay Per Use**: cobrar
apenas procedimentos efetivamente utilizados, com **precificação dinâmica** por empresa.

**Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Prisma 6, SQLite (dev).

---

## 2. Quatro portais segregados por role

| Portal | Login | Dashboard | Role | Público |
|--------|-------|-----------|------|---------|
| Prestador | `/login` | `/prestador` | `PRESTADOR` | Médicos / profissionais |
| Interno | `/interno/login` | `/interno/dashboard` | `INTERNO` | Equipe administrativa |
| Empresa PJ | `/pj/login` | `/pj` | `PJ` | RH / gestores corporativos |
| Beneficiário | `/beneficiario/login` | `/beneficiario` | `BENEFICIARIO` | Pacientes (self-service) |

**Senha demo (todos):** `bibi123`

| Portal | E-mail |
|--------|--------|
| Prestador | `dra.helena@bibi.health` |
| Interno | `faturamento@bibi.health` |
| PJ | `rh@techcorp.com` |
| Beneficiário | `joao.pereira@email.com` |

---

## 3. Setup local

```bash
npm install
cp .env.example .env          # se não existir
npm run db:push && npm run db:seed
npm run dev                   # http://localhost:3000
```

Variáveis `.env`:
- `DATABASE_URL` — SQLite (padrão `file:./dev.db`)
- `SESSION_SECRET` — HMAC do cookie de sessão

---

## 4. Segurança e multi-tenancy

- **Cookie httpOnly** `bibi_session` assinado com HMAC-SHA256 (`src/lib/session.ts`)
- **Proxy otimista** (`src/proxy.ts`) — redireciona ao login se não houver cookie
- **Validação real** em cada página/API via `getSessionUser()` / `requireUser([roles])`
- Dados isolados por `tenantId` em todas as queries de negócio
- PJ: escopo por `user.companyId`
- Beneficiário: escopo por `user.patientId` (anti-IDOR — sem ID na URL da API)

---

## 5. Modelo de dados (Prisma)

Entidades principais:

| Modelo | Descrição |
|--------|-----------|
| `Tenant` | Clínica/hospital (SaaS) |
| `User` | Login; `role` + opcional `companyId` (PJ) ou `patientId` (Beneficiário) |
| `Company` | Empresa contratante; status CRM (LEAD → CANCELADO) |
| `Patient` | Beneficiário/paciente |
| `Procedure` | Catálogo (CONSULTA/EXAME) com preço base |
| `PricingRule` | Multiplicador por empresa (precificação dinâmica) |
| `Appointment` | Agendamento |
| `ProcedureUsage` | **Núcleo Pay Per Use** — preço congelado no uso |
| `MedicalRecord` | Prontuário (PEP) |
| `Invoice` / `InvoiceItem` | Fatura e itens |
| `Subscription` / `SubscriptionCharge` | Recorrência |
| `Message` | Comunicação outbound (EMAIL/SMS/WHATSAPP) |
| `TimelineEvent` | Auditoria universal |

SQLite não suporta enums Prisma — `role`, `status`, `category` são `String`.

---

## 6. Fluxo Pay Per Use (end-to-end)

1. **Prestador** vê agenda em `/prestador`, abre atendimento
2. Registra **procedimentos** — preço calculado com desconto corporativo e congelado
3. Registra **PEP** e marca atendimento REALIZADO
4. **Interno** vê pendências em `/interno` (faturamento), gera **fatura**
5. **PJ** acompanha consumo em `/pj`
6. **Beneficiário** vê consumo transparente em `/beneficiario`

Exemplo seed: Consulta Clínica base R$ 180 → TechCorp paga R$ 153 (15% desconto).

---

## 7. Módulos do Portal Interno

| Rota | Módulo | Épico |
|------|--------|-------|
| `/interno/dashboard` | Dashboard Executivo (KPIs) | 8 |
| `/interno` | Faturamento Pay Per Use | core |
| `/interno/crm` | Pipeline CRM corporativo | 3 |
| `/interno/assinaturas` | Recorrência | 5 |
| `/interno/comunicacao` | Fila de mensagens | 7 |
| `/interno/beneficiarios/[id]` | Cliente 360° | 1 |

---

## 8. Épicos implementados

### Épico 1 — Cliente 360°
- `getPatientOverview()` — consolida paciente, atendimentos, procedimentos, PEP, faturas, timeline
- API: `GET /api/interno/patients/[id]/overview`

### Épico 2 — Timeline Universal
- `TimelineEvent` + `recordTimelineEvent()` em login, atendimento, faturamento, CRM, etc.
- Visível no Cliente 360° e no portal do beneficiário

### Épico 3 — CRM Corporativo
- `Company.status`: LEAD, PROPOSTA, NEGOCIACAO, ATIVO, INADIMPLENTE, CANCELADO
- API: `GET /api/interno/crm/pipeline`, `PATCH /api/interno/companies/[id]/status`

### Épico 4 — Motor de Cobrança
- Contratos Strategy: PIX, boleto, cartão (`src/lib/payments/`)
- **Sem adapter fake** — `PaymentProviderNotConfiguredError` se gateway não registrado
- Doc: `docs/PAYMENTS.md`
- Gateways previstos: Asaas, Efí, Banco Inter (`PAYMENT_GATEWAY` env)

### Épico 5 — Recorrência
- `Subscription` + `SubscriptionCharge` (PENDENTE/FATURADA/CANCELADA)
- Ciclos: MENSAL, TRIMESTRAL, SEMESTRAL, ANUAL
- API: `/api/interno/subscriptions/**`

### Épico 6 — Portal Beneficiário
- `User.patientId` vincula login ao `Patient`
- API: `GET /api/beneficiario/overview` (escopo sessão, sem IDOR)
- Self-service: agenda, consumo, faturas, assinatura, PEP

### Épico 7 — Comunicação
- `Message` enfileirada (PENDENTE) → dispatch via provider
- Contratos: EMAIL, SMS, WHATSAPP (`src/lib/communications/`)
- **Sem adapter fake** — SendGrid, Twilio, Meta (`COMMUNICATION_PROVIDER` env)
- Doc: `docs/COMMUNICATIONS.md`
- Templates: APPOINTMENT_REMINDER, INVOICE_DUE, SUBSCRIPTION_DUE, GENERIC

### Épico 8 — Dashboard Executivo
- `getExecutiveDashboard()` — KPIs: Pay Per Use pendente, MRR, CRM, fila de mensagens, timeline
- API: `GET /api/interno/dashboard`

---

## 9. KPIs do Dashboard Executivo

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

## 10. API REST (resumo)

Base: `http://localhost:3000/api`

**Auth:** `POST /auth/login` body `{ email, password, portal }` — portal: `prestador|interno|pj|beneficiario`

**Prestador:** agenda, atendimentos, procedimentos, PEP

**Interno:** dashboard, billing, invoices, patients/overview, crm, subscriptions, messages

**Beneficiário:** overview (self-service)

**PJ:** overview (empresa do usuário)

OpenAPI completa: `public/openapi.yaml` — Swagger UI em `/api-docs.html`

---

## 11. Arquivos-chave do código

```
src/
├── proxy.ts                    # Proteção de rotas (Next 16)
├── lib/
│   ├── session.ts              # Cookie HMAC
│   ├── api-auth.ts             # requireUser, requireBeneficiary
│   ├── roles.ts                # PORTALS e ROLES
│   ├── pricing.ts              # Pay Per Use + tenant scope
│   ├── patient-overview.ts     # Cliente 360°
│   ├── beneficiary-overview.ts # Self-service
│   ├── executive-dashboard.ts  # KPIs
│   ├── timeline.ts             # Auditoria
│   ├── subscription*.ts        # Recorrência
│   ├── message*.ts             # Comunicação
│   ├── payments/               # Motor cobrança (Strategy)
│   └── communications/         # Motor comunicação (Strategy)
├── app/
│   ├── api/                    # Route Handlers
│   ├── interno/                # Portal interno
│   ├── prestador/              # Portal prestador
│   ├── pj/                     # Portal empresa
│   └── beneficiario/           # Portal beneficiário
└── components/                 # Views React cliente
```

---

## 12. Dados de demonstração (seed)

**Empresa ativa:** TechCorp Benefícios LTDA (desconto 15% consulta clínica)

**Beneficiários:**
- João Pereira (TechCorp) — atendimento hoje, 2 procedimentos pendentes, assinatura mensal
- Maria Souza (TechCorp) — hemograma pendente, assinatura trimestral
- Pedro Almeida (particular) — fatura PAGA histórica, assinatura suspensa

**CRM:** 6 empresas em estágios diversos (LEAD a CANCELADO)

**Comunicação:** 2 mensagens PENDENTE (WhatsApp João, e-mail Maria)

---

## 13. Limitações da POC

- Senhas em texto puro (seed) — usar hash em produção
- SQLite local — migrar para Postgres em produção (Netlify Database)
- Prisma fixado na v6 (v7 quebra schema atual)
- Gateways de pagamento e comunicação: **somente contratos**, adapters não incluídos
- Deploy Netlify preparado; créditos podem limitar deploy cloud

---

## 14. Documentação complementar

| Documento | Conteúdo |
|-----------|----------|
| `README.md` | Guia completo, URLs, scripts |
| `docs/ARQUITETURA.md` | Diagramas Mermaid, épicos, checklists |
| `docs/PAYMENTS.md` | Motor de cobrança Strategy |
| `docs/COMMUNICATIONS.md` | Motor de comunicação Strategy |
| `docs/DESIGN_SYSTEM.md` | Design system, tokens CSS e white label |
| `public/openapi.yaml` | Especificação API |
| `AGENTS.md` | Instruções para agentes de IA |

---

## 15. Perguntas frequentes (FAQ)

**Como faço login no portal interno?**
→ `/interno/login` com `faturamento@bibi.health` / `bibi123`. Após login, vai para `/interno/dashboard`.

**Onde vejo o consumo de um beneficiário?**
→ Portal Interno: Cliente 360° em `/interno/beneficiarios/[id]`. Beneficiário: `/beneficiario`.

**Como funciona o desconto corporativo?**
→ `PricingRule` com `multiplier` (ex.: 0.85 = 15% desconto) por `procedureId` + `companyId`.

**Por que dispatch de mensagem falha?**
→ Nenhum adapter registrado. Configure `COMMUNICATION_PROVIDER` e registre adapter (ver `docs/COMMUNICATIONS.md`).

**Qual a diferença entre faturamento e dashboard?**
→ `/interno` = operação (gerar faturas). `/interno/dashboard` = visão executiva (KPIs consolidados).

---

## 16. Design system e white label

- **Tokens CSS** em `src/app/globals.css` (`--brand-*`, `--surface-*`, `--status-*`).
- **Modelo `TenantBranding`**: `displayName`, cores hex, `logoUrl`, `platformLabel`.
- **Componentes UI** em `src/components/ui/` (`Button`, `Input`, `Card`, `Badge`, `Alert`, `NavTabs`).
- **Layout**: `PortalShell`, `PageHeader`, `TenantTheme` (injeta CSS variables por tenant/portal).
- **Sessão**: `getSessionUser()` retorna `user.branding` após login.
- Seed inclui tenant demo **VitaCare** (azul) além da Clínica Bibi (teal).
- Ver `docs/DESIGN_SYSTEM.md`.

---

*Fim do documento — Sistema Bibi POC*
