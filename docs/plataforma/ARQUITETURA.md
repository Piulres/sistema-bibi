# Arquitetura — Sistema Bibi - ServiceOS v2.0

Documento técnico com os diagramas de arquitetura, modelo de dados (ER) e os
principais fluxos do sistema. Os diagramas usam [Mermaid](https://mermaid.js.org/)
e são renderizados automaticamente no GitHub.

> **Fluxos de usuário detalhados** (todos os portais, RBAC, máquinas de estado):
> [`FLUXOS.md`](FLUXOS.md)
>
> **Evidências visuais** (vídeos/screenshots): [`evidencias/README.md`](evidencias/README.md)
>
> **Deploy Netlify:** [`DEPLOY_NETLIFY.md`](DEPLOY_NETLIFY.md) · produção: https://sistema-bibi.netlify.app
>
> **Operações (dev, release, IA):** [`OPERACOES.md`](OPERACOES.md) · pacotes: [`RELEASES.md`](RELEASES.md)
>
> **ServiceOS v2.0 (multi-nicho):** [`V2_0.md`](V2_0.md) · [`V2_0_ARCHITECTURE.md`](V2_0_ARCHITECTURE.md) — `Tenant.niche`, `Tenant.labels`, `useLabels()`

---

## 0. ServiceOS v2.0 — multi-nicho

A partir da v2.0, o mesmo código-core atende múltiplos verticais via parametrização por tenant:

| Campo | Tipo | Função |
|-------|------|--------|
| `Tenant.niche` | `String` | `MEDICAL` \| `VET` \| `DENTAL` \| `LEGAL` \| `SPA` \| `EDUCATION` |
| `Tenant.labels` | JSON (`String`) | Dicionário de termos da UI (ex.: paciente → "Pet" no VET) |
| `Procedure.serviceType` | `String?` | Classificação livre por nicho |

```mermaid
flowchart LR
  Tenant["Tenant<br/>niche + labels"]
  UI["Landing + Portais<br/>useLabels()"]
  Core["Motores compartilhados<br/>Agenda · ProcedureUsage · PIX"]
  Tenant --> UI
  Tenant --> Core
  UI --> Core
```

- **Server:** `src/lib/niche/resolve.ts`, `src/lib/niche/labels.ts`
- **Client:** `src/hooks/useLabels.tsx` via `NicheProvider` em `PortalShell`
- **Landing:** `/?niche=VET` para preview local; domínio customizado em produção

Detalhes: [`V2_0_ARCHITECTURE.md`](V2_0_ARCHITECTURE.md).

### 0.1 Camada de Abstração de Linguagem (Nichos)

O nicho deixa de ser "lembrança do desenvolvedor" e vira **regra nativa do sistema**:

```mermaid
flowchart TB
  Master["src/constants/niches.ts<br/>NICHE_MASTER_LABELS"]
  DB["Tenant.labels JSON<br/>(overrides opcionais)"]
  Merge["mergeNicheLabels()"]
  Session["SessionUser.labels"]
  Hook["useLabels()"]
  UI["Telas dos 4 portais"]
  Master --> Merge
  DB --> Merge
  Merge --> Session --> Hook --> UI
```

| Camada | Responsabilidade |
|--------|------------------|
| **Prisma** | `Tenant.niche` + `Tenant.labels` — o "idioma" viaja com o cliente |
| **Constants** | `NICHE_MASTER_LABELS` — guarda-corpo TypeScript; chaves em `NICHE_LABEL_KEYS` |
| **Hook** | `useLabels()` — `{ labels, t, niche }` em componentes client |
| **Nav** | `buildPrestadorNavTabs`, `buildCadastrosTabs`, etc. — menus dinâmicos |

**Exemplo:** em vez de `<h1>Paciente</h1>`, use `<h1>{labels.patient}</h1>`. No nicho `LEGAL` → "Cliente"; no `VET` → "Pet".

Seed demo: Clínica Horizonte (`MEDICAL`), PetCare (`VET` com override "Banho/Tosa"), Lex (`LEGAL`), etc. — ver `prisma/seed-data/niche-tenants.ts`.

| Nicho | `patient` | `procedure` | `medicalRecord` |
|-------|-----------|-------------|-----------------|
| `MEDICAL` | Paciente | Procedimento | Prontuário |
| `VET` | Pet | Serviço | Ficha clínica |
| `LEGAL` | Cliente | Serviço jurídico | Dossiê |
| `EDUCATION` | Aluno | Aula | Histórico pedagógico |

Fluxo: `Tenant.labels` (JSON) → `mergeNicheLabels()` → `SessionUser` → `NicheProvider` → `useLabels().labels.patient`.

Os **quatro portais segregados** são a base da transparência: cada nicho configura sua própria "estação de trabalho" com nomenclatura e branding isolados por tenant.

### 0.2 Identidade visual, design system e Blobs

**Design system semântico** (`docs/DESIGN_SYSTEM.md`):

- Tokens em `src/app/globals.css`: `--brand-primary`, `--surface-card`, `--text-secondary`, etc.
- Primitivos em `src/components/ui/`; composição via `TenantTheme` + `data-theme`.
- **`colorScheme`** por tenant: `light` | `dark` | `system` — superfícies e status adaptam-se automaticamente.

**White label performático:**

```mermaid
flowchart LR
  Upload["POST /api/interno/branding/logo"]
  Blobs["Netlify Blobs<br/>bibi-tenant-logos"]
  Local["public/tenant-logos<br/>(dev)"]
  CDN["GET /api/branding/logo/:tenantId"]
  UI["PortalHeader · exports PDF"]
  Upload --> Blobs
  Upload --> Local
  Blobs --> CDN
  Local --> CDN
  CDN --> UI
```

- Implementação: `src/lib/storage/tenant-logo.ts` — store `bibi-tenant-logos`, consistência `strong` na escrita.
- Views migradas para o padrão de cores semânticas; paletas automáticas por `niche` quando o tenant não customiza (`src/lib/niche/branding.ts`).

### 0.3 Segurança — proxy e sessão HMAC

| Camada | Mecanismo | Arquivo |
|--------|-----------|---------|
| **Edge/Proxy** | Checagem otimista de cookie antes do App Router | `src/proxy.ts` |
| **Servidor** | Validação HMAC-SHA256 + `role` + RBAC interno | `src/lib/session.ts`, `interno-guard.ts` |
| **API** | `requireUser()` / `requireInternoModule()` em cada handler | `src/lib/api-auth.ts` |

O `proxy.ts` é o substituto do middleware no **Next.js 16** — exclusivo desta versão do framework. A validação real da sessão **nunca** confia apenas no proxy; Server Components e Route Handlers revalidam assinatura e perfil.

Cookie `bibi_session`: `userId` + HMAC com `SESSION_SECRET`; `httpOnly`, `sameSite=lax`, 8h de validade.

---

## 1. Visão de componentes

```mermaid
flowchart TB
  subgraph Cliente["Navegador (Mobile-first)"]
    Land["Landing /"]
    PortP["Portal Prestador<br/>/login · /prestador"]
    PortI["Portal Interno<br/>/interno/login · /interno/dashboard<br/>/interno · cadastros · agenda · crm<br/>/interno/assinaturas · comunicacao · relatorios<br/>/interno/branding · integracoes · seguranca"]
    PortPJ["Portal Empresa (PJ)<br/>/pj/login · /pj"]
    PortBen["Portal Beneficiário<br/>/beneficiario/login · /beneficiario"]
  end

  subgraph Next["Next.js 16 (App Router)"]
    Proxy["proxy.ts<br/>(checagem otimista de sessão)"]
    Pages["Server Components<br/>(valida sessão + role)"]
    API["Route Handlers /api/**"]
    subgraph Lib["src/lib"]
      Sess["session.ts<br/>(HMAC + cookie httpOnly)"]
      Auth["api-auth.ts<br/>(requireUser/role)"]
      Price["pricing.ts<br/>(precificação dinâmica)"]
      Overview["patient-overview.ts<br/>(Cliente 360°)"]
      Timeline["timeline.ts<br/>(auditoria universal)"]
      Payments["payments/* + invoice-service<br/>(PIX mock Tier 1)"]
      Comms["communications/* + reminder-service<br/>(console adapter Tier 1)"]
      Webhooks["webhook-service.ts<br/>(B2B + retry Tier 3/4)"]
      RBAC["interno-permissions.ts<br/>(RBAC Tier 3)"]
      MFA["mfa.ts · tiss-service.ts<br/>(Tier 4)"]
      Niche["niche/* · useNiche.tsx<br/>(labels dinâmicos v2.0)"]
      Brand["theme/* · tenant-logo.ts<br/>(Blobs + design system)"]
      Dashboard["executive-dashboard.ts"]
      DB["db.ts (Prisma Client)"]
    end
  end

  SQLite[("SQLite<br/>dev.db")]

  Cliente -->|HTTP| Proxy --> Pages
  Pages --> API
  API --> Auth --> Sess
  API --> Price
  API --> Overview --> DB
  API --> Timeline --> DB
  API --> Payments
  API --> Comms
  API --> Webhooks
  API --> RBAC
  API --> MFA
  API --> DB --> SQLite
  Sess --> DB
```

---

## 2. Modelo de dados (ER)

```mermaid
erDiagram
  Tenant ||--o{ User : possui
  Tenant ||--o{ Company : possui
  Tenant ||--o{ Patient : possui
  Tenant ||--o{ Procedure : possui
  Tenant ||--o{ Appointment : possui
  Tenant ||--o{ Invoice : possui

  Company ||--o{ User : "vincula (PJ)"
  Company ||--o{ Patient : "beneficiários"
  Company ||--o{ PricingRule : "regras de preço"
  Company ||--o{ Invoice : "faturas"

  User ||--o{ Appointment : "atende (provider)"
  User ||--o{ MedicalRecord : "registra"

  Patient ||--o{ Appointment : "agenda"
  Patient ||--o{ MedicalRecord : "prontuário"
  Patient ||--o{ Invoice : "faturado"

  Procedure ||--o{ PricingRule : "ajustado por"
  Procedure ||--o{ ProcedureUsage : "usado em"

  Appointment ||--o{ ProcedureUsage : "registra (Pay Per Use)"
  Appointment ||--o{ MedicalRecord : "gera"

  ProcedureUsage |o--o| InvoiceItem : "faturado como"
  Invoice ||--o{ InvoiceItem : "contém"
  Tenant ||--o{ TimelineEvent : "audita"
  Tenant ||--o{ WebhookEndpoint : possui
  Tenant ||--o| TenantBranding : branding

  WebhookEndpoint ||--o{ WebhookDelivery : entregas

  Invoice ||--o{ Payment : pagamentos

  Tenant {
    string id PK
    string name
    string cnpj
  }
  User {
    string id PK
    string email
    string role "PRESTADOR|INTERNO|PJ|BENEFICIARIO"
    string internoProfile "ADMIN|FATURAMENTO|RECEPCAO|READONLY"
    boolean mfaEnabled
    string tenantId FK
    string companyId FK "nullable"
    string patientId FK "nullable"
  }
  Company {
    string id PK
    string name
    string cnpj
    string status "LEAD|PROPOSTA|NEGOCIACAO|ATIVO|INADIMPLENTE|CANCELADO"
    boolean contractActive
  }
  Patient {
    string id PK
    string name
    string cpf
    datetime consentAt "LGPD"
    string companyId FK "nullable"
  }
  Procedure {
    string id PK
    string code
    string category "CONSULTA|EXAME"
    string tissCode "nullable"
    float basePrice
  }
  PricingRule {
    string id PK
    float multiplier
    string procedureId FK
    string companyId FK "nullable"
  }
  Appointment {
    string id PK
    datetime scheduledAt
    string status "AGENDADO|CONFIRMADO|REALIZADO|FALTOU|CANCELADO"
    string modality "PRESENCIAL|TELE"
    string telemedicineUrl "nullable"
    string patientId FK
    string providerId FK
  }
  ProcedureUsage {
    string id PK
    float priceCharged "snapshot"
    boolean billed
    string appointmentId FK
    string procedureId FK
  }
  MedicalRecord {
    string id PK
    string recordType "EVOLUCAO|ANAMNESE|RECEITA|ATESTADO"
    string content
    string patientId FK
    string providerId FK
  }
  Invoice {
    string id PK
    float total
    string status "ABERTA|FECHADA|PAGA"
    string patientId FK
    string companyId FK "nullable"
  }
  InvoiceItem {
    string id PK
    string description
    float amount
    string invoiceId FK
    string usageId FK "nullable"
    string subscriptionChargeId FK "nullable"
  }
  Payment {
    string id PK
    string method "PIX|MANUAL"
    string status "PENDING|CONFIRMED"
    float amount
    string invoiceId FK
  }
  WebhookEndpoint {
    string id PK
    string url
    string events "JSON array"
    boolean active
  }
  WebhookDelivery {
    string id PK
    string status "SUCCESS|FAILED|PENDING"
    int attempt
    datetime nextRetryAt
  }
  TimelineEvent {
    string id PK
    string tenantId FK
    string entityType
    string entityId
    string action
    string description
    datetime createdAt
    string createdBy "nullable"
  }
```

---

## 3. Fluxo Pay Per Use (sequência)

```mermaid
sequenceDiagram
  actor P as Prestador
  actor I as Interno
  participant API as API (Route Handlers)
  participant DB as SQLite (Prisma)

  P->>API: POST /api/auth/login (portal=prestador)
  API-->>P: cookie de sessão (httpOnly, HMAC)
  P->>API: GET /api/prestador/agenda
  API->>DB: agendamentos do dia
  DB-->>API: lista
  API-->>P: agenda

  P->>API: POST /appointments/{id}/procedures {procedureId}
  API->>DB: computePrice (precificação dinâmica)
  API->>DB: cria ProcedureUsage (preço congelado, billed=false)
  API-->>P: procedimento registrado

  P->>API: POST /api/prestador/records (PEP)
  P->>API: PATCH /appointments/{id} {status: REALIZADO}

  I->>API: POST /api/auth/login (portal=interno)
  I->>API: GET /api/interno/billing
  API->>DB: usos não faturados (billed=false)
  API-->>I: pendentes agrupados por paciente
  I->>API: POST /api/interno/invoices {patientId}
  API->>DB: cria Invoice + InvoiceItem; marca usos billed=true
  API-->>I: fatura FECHADA

  I->>API: GET /api/interno/patients/{id}/overview
  API->>DB: Patient + appointments + usages + records + invoices
  API-->>I: Cliente 360° consolidado
```

---

## 4. Segregação de acesso (multi-tenancy)

```mermaid
flowchart LR
  R{role da sessão}
  R -->|PRESTADOR| A["/prestador/*<br/>agenda, atendimento, PEP"]
  R -->|INTERNO| B["/interno/*<br/>RBAC por internoProfile"]
  R -->|PJ| C["/pj/*<br/>contratos, beneficiários"]
  R -->|BENEFICIARIO| E["/beneficiario/*<br/>self-service"]
  R -.->|role incorreto| D["403 / redirect ao login"]
```

A validação ocorre em duas camadas: `src/proxy.ts` (checagem otimista do cookie,
redireciona ao login) e o servidor (`requireUser([...roles])` em cada handler e
`getSessionUser()` em cada página), que valida assinatura HMAC e `role`.

---

## 6. Cliente 360° (Épico 1)

Visão consolidada do beneficiário no Portal Interno, reutilizando entidades
existentes sem duplicar dados.

```mermaid
flowchart LR
  Billing["BillingView<br/>/interno"] -->|"1 clique"| Page["/interno/beneficiarios/[id]"]
  Page --> View["PatientOverviewView"]
  View --> API["GET /api/interno/patients/{id}/overview"]
  API --> Svc["patient-overview.ts"]
  Svc --> DB[("Patient<br/>Appointment<br/>ProcedureUsage<br/>MedicalRecord<br/>Invoice")]
```

**Camadas:**
- `src/lib/patient-overview.ts` — query Prisma consolidada + formatação
- `src/app/api/interno/patients/[id]/overview/route.ts` — endpoint (role INTERNO)
- `src/app/interno/beneficiarios/[id]/page.tsx` — página protegida
- `src/components/PatientOverviewView.tsx` — UI Cliente 360°

### Checklist de homologação (Épico 1)

- [x] Acessar overview a partir de paciente pendente em billing (link Cliente 360°)
- [x] Ver dados pessoais + empresa vinculada
- [x] Ver histórico de atendimentos (seed: João, Maria, Pedro)
- [x] Ver procedimentos realizados com preços congelados
- [x] Ver PEP (João tem registro no seed)
- [ ] Ver faturas (após gerar via billing — fluxo manual)
- [x] Tentar acessar paciente inexistente → 404
- [x] Prestador/PJ não acessam rota interno → redirect/403 (via RBAC)
- [x] OpenAPI atualizado
- [x] Build passando

---

## 7. Timeline Universal (Épico 2)

Sistema de auditoria de eventos com entidade `TimelineEvent` e service centralizado.

```mermaid
flowchart LR
  API["Route Handlers<br/>(mutações)"] --> Svc["recordTimelineEvent()"]
  Svc --> TE[("TimelineEvent")]
  Overview["getPatientOverview()"] --> Query["getPatientTimelineEvents()"]
  Query --> TE
  View["PatientOverviewView"] --> TimelineUI["Timeline visual"]
```

**Eventos registrados automaticamente:**
- `LOGIN` — autenticação
- `UPDATED` / `APPOINTMENT_COMPLETED` — status de atendimento
- `PROCEDURE_REGISTERED` — Pay Per Use
- `MEDICAL_RECORD_CREATED` — PEP
- `INVOICE_ISSUED` — faturamento
- `CREATED` — seed e futuros cadastros

**Arquivos:**
- `prisma/schema.prisma` — model `TimelineEvent`
- `src/lib/timeline.ts` — `recordTimelineEvent`, `getPatientTimelineEvents`
- Hooks nos handlers de login, atendimento, procedimentos, PEP e faturas

### Checklist de homologação (Épico 2)

- [x] Model `TimelineEvent` criado (compatível SQLite/PostgreSQL)
- [x] Service centralizado sem acoplamento à UI
- [x] Eventos automáticos nos fluxos existentes
- [x] Timeline visível no Cliente 360°
- [x] Seed com eventos de demonstração (João/Maria)
- [x] OpenAPI e ARQUITETURA atualizados
- [x] Build passando

---

## 9. CRM Corporativo (Épico 3)

Evolução de `Company` com campo `status` e pipeline visual no Portal Interno.

```mermaid
flowchart LR
  Interno["/interno/crm"] --> View["CrmPipelineView"]
  View --> GET["GET /api/interno/crm/pipeline"]
  View --> PATCH["PATCH /api/interno/companies/{id}/status"]
  PATCH --> CRM["company-crm.ts"]
  PATCH --> TL["recordTimelineEvent<br/>CONTRACT_CHANGED"]
  GET --> Pipe["company-pipeline.ts"]
  Pipe --> DB[("Company")]
```

**Status do pipeline:** LEAD → PROPOSTA → NEGOCIACAO → ATIVO → INADIMPLENTE → CANCELADO

**Arquivos:**
- `src/lib/company-crm.ts` — constantes e regras de status
- `src/lib/company-pipeline.ts` — consulta agrupada por etapa
- `src/components/CrmPipelineView.tsx` — kanban horizontal (mobile-first)
- `src/components/InternoNav.tsx` — navegação Faturamento / CRM

### Checklist de homologação (Épico 3)

- [x] Campo `Company.status` sem tabela paralela
- [x] `contractActive` sincronizado com status (compat. Portal PJ)
- [x] Pipeline visual com 6 colunas
- [x] Mover empresa entre etapas via PATCH
- [x] Evento `CONTRACT_CHANGED` na timeline
- [x] Seed com empresas em múltiplas etapas
- [x] OpenAPI, README e ARQUITETURA atualizados
- [x] Build passando

---

## 10. Motor de Cobrança (Épico 4)

Contratos Strategy para PIX, boleto e cartão. **Tier 1** implementa `MockPixAdapter`,
modelo `Payment` e `invoice-service.ts` (PIX, marcar PAGA, bridge assinatura).

```mermaid
classDiagram
  class PaymentProvider {
    <<interface>>
    +gatewayId
    +supportedMethods
    +createCharge()
    +getCharge()
    +cancelCharge()
  }
  class PixProvider {
    <<interface>>
    +createPixCharge()
  }
  class BoletoProvider {
    <<interface>>
    +createBoletoCharge()
  }
  class CardProvider {
    <<interface>>
    +createCardCharge()
  }
  class PaymentGatewayRegistry {
    +register()
    +getPixProvider()
    +getBoletoProvider()
    +getCardProvider()
  }
  PaymentProvider <|-- PixProvider
  PaymentProvider <|-- BoletoProvider
  PaymentProvider <|-- CardProvider
  PaymentGatewayRegistry --> PaymentProvider
```

Detalhes: [`docs/PAYMENTS.md`](PAYMENTS.md)

### Checklist de homologação (Épico 4)

- [x] Interfaces `PaymentProvider`, `PixProvider`, `BoletoProvider`, `CardProvider`
- [x] `PaymentGatewayRegistry` (Strategy) + `charge-service` (fachada)
- [x] Tipos `ChargeReference` vinculados a `invoiceId`
- [x] Erro explícito quando gateway não configurado
- [x] Documentação de adapters Asaas / Efí / Inter
- [x] **MockPixAdapter** POC (`PAYMENT_GATEWAY=mock`) + modelo `Payment`
- [x] Endpoints PIX e marcar PAGA (interno + beneficiário)
- [x] Build passando

---

## 11. Recorrência (Épico 5)

Assinaturas recorrentes vinculadas a beneficiário e/ou empresa, com geração
programada de cobranças futuras (`SubscriptionCharge`) que podem ser faturadas
posteriormente via Pay Per Use ou motor de cobrança (Épico 4).

```mermaid
flowchart LR
  subgraph cadastro
    A[Interno cria Subscription] --> B[Timeline CREATED]
  end
  subgraph cobranca
    C[Gerar cobranças] --> D[SubscriptionCharge PENDENTE]
    D --> E[Timeline SUBSCRIPTION_CHARGES_GENERATED]
    E --> F[Faturamento futuro / Invoice]
  end
  cadastro --> cobranca
```

| Camada | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Schema | `prisma/schema.prisma` | `Subscription`, `SubscriptionCharge` |
| Domínio | `src/lib/subscription.ts` | Ciclos, status, `computeUpcomingDueDates()` |
| Serviço | `src/lib/subscription-service.ts` | CRUD, geração de cobranças, timeline |
| API | `src/app/api/interno/subscriptions/**` | Endpoints REST (role `INTERNO`) |
| UI | `src/components/SubscriptionsView.tsx` | Portal `/interno/assinaturas` |

### Checklist de homologação (Épico 5)

- [x] Modelos `Subscription` e `SubscriptionCharge` no Prisma
- [x] Ciclos MENSAL / TRIMESTRAL / SEMESTRAL / ANUAL
- [x] Geração de cobranças futuras com horizonte configurável
- [x] Integração com Timeline (`SUBSCRIPTION`, `SUBSCRIPTION_CHARGES_GENERATED`)
- [x] Visível no Cliente 360° (timeline do beneficiário)
- [x] Seed com assinaturas demo (João, Maria, Pedro)
- [x] Build passando

---

## 12. Portal Beneficiário (Épico 6)

Quarto portal segregado por `role: BENEFICIARIO`. O usuário é vinculado a um
`Patient` via `User.patientId` (mesmo padrão de `User.companyId` no PJ).

```mermaid
flowchart LR
  Login["/beneficiario/login"] --> Session["Sessão + patientId"]
  Session --> API["GET /api/beneficiario/overview"]
  API --> Svc["getBeneficiaryOverview()"]
  Svc --> PO["getPatientOverview()"]
  Svc --> Sub["subscriptions do patientId"]
  PO --> View["BeneficiarioView"]
  Sub --> View
```

| Camada | Arquivo | Responsabilidade |
|--------|---------|------------------|
| Schema | `prisma/schema.prisma` | `User.patientId` → `Patient` |
| Serviço | `src/lib/beneficiary-overview.ts` | Reutiliza Cliente 360° + assinaturas |
| API | `src/app/api/beneficiario/overview/route.ts` | Escopo fixo em `user.patientId` |
| UI | `src/components/BeneficiarioView.tsx` | Self-service read-only |
| Auth | `requireBeneficiary()` em `api-auth.ts` | Impede IDOR |

### Checklist de homologação (Épico 6)

- [x] Role `BENEFICIARIO` + portal em `roles.ts` e `proxy.ts`
- [x] `User.patientId` no schema e sessão
- [x] API self-service sem expor IDs arbitrários
- [x] Reutilização de `getPatientOverview()` (sem duplicar queries)
- [x] Seed: `joao.pereira@email.com` vinculado a João Pereira
- [x] Landing page com 4º portal
- [x] Build passando

---

## 13. Comunicação (Épico 7)

Fila de mensagens outbound (e-mail, SMS, WhatsApp) com contratos Strategy,
**ConsoleEmailAdapter** POC e lembretes automáticos (`reminder-service`).

Detalhes: [`docs/COMMUNICATIONS.md`](COMMUNICATIONS.md)

### Checklist de homologação (Épico 7)

- [x] Modelo `Message` no Prisma (PENDENTE → ENVIADA | FALHA | CANCELADA)
- [x] Interfaces `EmailProvider`, `SmsProvider`, `WhatsAppProvider`
- [x] `CommunicationGatewayRegistry` + `notification-service`
- [x] `message-service` com fila, templates e dispatch
- [x] Timeline (`MESSAGE_QUEUED`, `MESSAGE_SENT`, `MESSAGE_FAILED`)
- [x] Portal `/interno/comunicacao`
- [x] Seed com mensagens demo enfileiradas
- [x] **ConsoleEmailAdapter** + cron lembretes (`/api/cron/reminders`)
- [x] Build passando

---

## 14. Tier 1 — Ciclo de receita

Bridge assinatura → fatura, PIX mock, marcar PAGA, lembretes automáticos.

| Camada | Arquivo |
|--------|---------|
| Serviço | `src/lib/invoice-service.ts` |
| Adapter | `src/lib/payments/adapters/mock-pix-adapter.ts` |
| Lembretes | `src/lib/reminder-service.ts` |
| UI | `BillingView`, `BeneficiarioView`, `SubscriptionsView` |

---

## 17. Tier 2 — Operação

CRUD admin, agenda interna, agendamento self-service, relatórios CSV, PEP estruturado, hash scrypt.

| Rota UI | Serviço |
|---------|---------|
| `/interno/cadastros` | `patient-service`, `company-service`, `procedure-service`, `user-service` |
| `/interno/agenda` | `appointment-service` |
| `/interno/relatorios` | `reports/billing-report.ts` |
| `/beneficiario` (agendar) | `scheduling-service` |

---

## 18. Tier 3 — B2B, RBAC, LGPD

| Feature | Arquivos |
|---------|----------|
| RBAC | `interno-permissions.ts`, `interno-guard.ts` |
| Webhooks | `webhook-service.ts`, `IntegracoesView.tsx` |
| Portal PJ | `pj-portal-service.ts`, `PjView.tsx` |
| LGPD | `patient-export.ts`, export JSON |
| Domínio custom | `tenant-resolver.ts`, `TenantBranding.customDomain` |

---

## 19. Tier 4 — Enterprise

| Feature | Arquivos |
|---------|----------|
| MFA TOTP | `mfa.ts`, `/interno/seguranca`, `SecurityView.tsx` |
| Telemedicina | `telemedicine.ts`, `Appointment.modality` |
| TISS XML | `tiss-service.ts`, `GET /api/interno/invoices/[id]/tiss` |
| Webhook retry | `WebhookDelivery`, cron `/api/cron/webhooks` |

---

## 15. Dashboard Executivo (Épico 8)

Visão consolidada de KPIs do tenant no Portal Interno, agregando dados dos
épicos anteriores sem duplicar entidades.

```mermaid
flowchart LR
  Page["/interno/dashboard"] --> API["GET /api/interno/dashboard"]
  API --> Svc["getExecutiveDashboard()"]
  Svc --> PP["Pay Per Use pendente"]
  Svc --> CRM["Pipeline CRM"]
  Svc --> Sub["MRR / recorrência"]
  Svc --> Msg["Fila de comunicação"]
  Svc --> TL["Timeline recente"]
```

| KPI | Fonte |
|-----|-------|
| Pendente Pay Per Use | `ProcedureUsage` não faturados |
| Total faturado | `Invoice` |
| MRR estimado | `Subscription` ATIVA (normalizado mensal) |
| Pipeline CRM | `Company` por status |
| Atividade recente | `TimelineEvent` (últimos 10) |

### Checklist de homologação (Épico 8)

- [x] `getExecutiveDashboard()` com agregações paralelas
- [x] API `GET /api/interno/dashboard`
- [x] UI `/interno/dashboard` + aba no `InternoNav`
- [x] Links para módulos e Cliente 360°
- [x] Build passando

---

## 20. Documentação da API

A especificação **OpenAPI 3.0** está em [`public/openapi.yaml`](../public/openapi.yaml).
Fluxos de usuário detalhados: [`FLUXOS.md`](FLUXOS.md).
Com o servidor rodando (`npm run dev`), acesse a UI interativa em:

- **Swagger UI:** http://localhost:3000/api-docs.html
- **Spec (YAML):** http://localhost:3000/openapi.yaml
