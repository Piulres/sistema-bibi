# Arquitetura — Sistema Bibi

Documento técnico com os diagramas de arquitetura, modelo de dados (ER) e os
principais fluxos do sistema. Os diagramas usam [Mermaid](https://mermaid.js.org/)
e são renderizados automaticamente no GitHub.

---

## 1. Visão de componentes

```mermaid
flowchart TB
  subgraph Cliente["Navegador (Mobile-first)"]
    Land["Landing /"]
    PortP["Portal Prestador<br/>/login · /prestador"]
    PortI["Portal Interno<br/>/interno/login · /interno<br/>/interno/beneficiarios/[id]"]
    PortPJ["Portal Empresa (PJ)<br/>/pj/login · /pj"]
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
      DB["db.ts (Prisma Client)"]
    end
  end

  SQLite[("SQLite<br/>dev.db")]

  Cliente -->|HTTP| Proxy --> Pages
  Pages --> API
  API --> Auth --> Sess
  API --> Price
  API --> Overview --> DB
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

  ProcedureUsage |o--|| InvoiceItem : "faturado como"
  Invoice ||--o{ InvoiceItem : "contém"

  Tenant {
    string id PK
    string name
    string cnpj
  }
  User {
    string id PK
    string email
    string role "PRESTADOR|INTERNO|PJ"
    string tenantId FK
    string companyId FK "nullable"
  }
  Company {
    string id PK
    string name
    string cnpj
    boolean contractActive
  }
  Patient {
    string id PK
    string name
    string cpf
    string companyId FK "nullable"
  }
  Procedure {
    string id PK
    string code
    string category "CONSULTA|EXAME"
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
    string usageId FK
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
  R -->|INTERNO| B["/interno/*<br/>faturamento · Cliente 360°"]
  R -->|PJ| C["/pj/*<br/>contratos, beneficiários"]
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

## 7. Documentação da API

A especificação **OpenAPI 3.0** está em [`public/openapi.yaml`](../public/openapi.yaml).
Com o servidor rodando (`npm run dev`), acesse a UI interativa em:

- **Swagger UI:** http://localhost:3000/api-docs.html
- **Spec (YAML):** http://localhost:3000/openapi.yaml
