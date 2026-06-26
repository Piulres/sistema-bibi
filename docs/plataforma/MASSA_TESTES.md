# Massa de testes e dados demo — Sistema Bibi - ServiceOS

Mapa da massa de dados, perfis de seed, cobertura por portal/feature e
validação automatizada. Complementa [`TESTES.md`](TESTES.md) e
[`OPERACAO_DADOS.md`](OPERACAO_DADOS.md).

---

## Perfis de seed

Dois eixos independentes controlam a massa:

| Variável | Valores | Padrão | O que controla |
|----------|---------|--------|----------------|
| `SEED_PROFILE` | `market` \| `operation-1y` | `market` | **Quantos clientes B2B** e equipe PJ por cliente |
| `SEED_SCALE` | `small` \| `medium` \| `large` \| `operation-1y` | `medium` | **Volume** de agendamentos, mensagens, histórico |

> Com `SEED_PROFILE=operation-1y`, a escala é forçada para `operation-1y`
> (365 dias, 12 meses de baseline, ~320 agendamentos no Horizonte).

### `market` — pipeline comercial (padrão)

- **50 empresas PJ** no tenant Horizonte (24 ATIVO + pipeline CRM)
- **1 usuário PJ** por empresa com contrato (RH)
- Baseline de faturamento: **6 meses**
- Histórico operacional: 90–365 dias conforme `SEED_SCALE`

### `operation-1y` — operação realista (1 ano)

- **20 clientes B2B** (14 ATIVO · 2 INADIMPLENTE · 2 NEGOCIAÇÃO · 1 PROPOSTA · 1 LEAD)
- **3–9 usuários PJ** por cliente com contrato (RH, Financeiro, Benefícios, Compras…)
- **365 dias** de histórico em agenda/PPU
- Baseline de faturamento: **12 meses**
- TechCorp permanece âncora demo (João, Maria, `rh@techcorp.com`)

```bash
# Gerar massa de 1 ano com 20 clientes
SEED_PROFILE=operation-1y npm run db:seed
SEED_PROFILE=operation-1y npm run db:verify
```

Código: `prisma/seed-data/profile.ts` · `companies-operation.ts` · `scale.ts`

---

## Tenants e segmentos

| Slug | Nicho | Papel | Clientes PJ (Horizonte) |
|------|-------|-------|-------------------------|
| `horizonte` | MEDICAL | Tenant principal Bibi | 20 ou 50 (perfil) |
| `vitacare` | MEDICAL | White-label | Pool reduzido |
| `petcare` | VET | Veterinária | ~8 empresas parceiras |
| `smile` | DENTAL | Odontologia | ~8 |
| `lex` | LEGAL | Jurídico | ~8 |
| `zen` | SPA | Bem-estar | ~8 |
| `eduprime` | EDUCATION | Educação | ~8 |

**Modo operação** (`operation.db`): tenant `bibi-saude` — bootstrap mínimo (5 usuários, 14 procedimentos, sem clientes). Ver `operation-bootstrap.ts`.

Documentação por segmento: [`docs/segmentos/README.md`](../segmentos/README.md)

---

## O que é comum a todos os segmentos

| Camada | Comum | Específico por nicho |
|--------|-------|----------------------|
| **Tenant** | `slug`, `niche`, `labels`, `branding` | Glossário em `NICHE_MASTER_LABELS` |
| **Portais** | 4 roles: INTERNO, PRESTADOR, PJ, BENEFICIARIO | Labels de nav via `useLabels()` |
| **Catálogo** | Procedimentos com `code`, `category`, `basePrice` | Códigos e nomes por vertical |
| **CRM B2B** | `Company.status` (ATIVO → LEAD) | Setores e casos de uso no seed |
| **Operação** | Agenda, PPU, faturas, assinaturas, timeline | VET: pets; MEDICAL: estoque/PEP |
| **Auth** | Senha `bibi123`, cookie `bibi_segment` | Login valida `user.tenantId` |

**Labels obrigatórias (15 chaves):** `patient`, `provider`, `procedure`, `appointment`,
`beneficiary`, `company`, `portalBeneficiary`, `portalProvider`, `service` (+ plurais).
Fonte: `src/constants/niches.ts`.

---

## Massa por portal

### Interno (`/interno`)

| Feature | Entidades seed | Credenciais demo |
|---------|----------------|------------------|
| Dashboard / relatórios | Faturas baseline, KPIs | `faturamento@bibi.health` (ADMIN) |
| RBAC | 5 perfis internos | `financeiro@`, `recepcao@`, `seguranca@` (MFA) |
| Agenda + walk-in | Appointments, PPU pendente | João hoje 09:00 |
| Cadastros (27 entidades) | Companies, patients, procedures | CRUD map em `crud-operations-map.ts` |
| Faturamento / PIX | Invoices, payments mock | Maria: PIX pendente |
| Assinaturas | Subscriptions + charges | João telemedicina, Pedro suspenso |
| PEP / Care Chart | Medical records, clinical profile | João completo |
| Estoque | Medical products, lots, kits | SKU `MAT-LUVA-M` |
| Integrações | Webhook endpoint demo | ERP TechCorp |
| Comunicações | Message queue | WhatsApp João, e-mail Maria |
| Segurança | MFA TOTP, demo reset | Secret `JBSWY3DPEHPK3PXP` |

### Prestador (`/prestador`)

| Feature | Massa |
|---------|-------|
| Agenda do dia | Consultas João, Maria, Pedro |
| Atendimento / PPU | Procedure usages com preço cobrado |
| Prontuário | Evolução + receita João |
| Telemedicina | Maria modality=TELE |

Credencial: `dra.helena@bibi.health`

### Empresa PJ (`/pj`)

| Feature | Massa |
|---------|-------|
| Overview / KPIs | Empresas ATIVO com beneficiários |
| Relatórios / export | Faturas corporativas baseline |
| Pipeline CRM | Status variados (perfil `market`: 50; `operation-1y`: 20) |
| Equipe PJ | 1 usuário (`market`) ou 3–9 (`operation-1y`) |

Credencial: `rh@techcorp.com` (TechCorp)

### Beneficiário (`/beneficiario`)

| Persona | Fluxo coberto |
|---------|---------------|
| **João** | PPU pendente, PEP, assinatura ativa, lembrete WhatsApp |
| **Maria** | Fatura FECHADA + PIX pendente, telemedicina |
| **Pedro** | Particular, fatura PAGA, assinatura suspensa |

Credenciais: `joao.pereira@email.com`, `maria.souza@email.com`, `pedro.almeida@email.com`

---

## Massa por segmento (multi-nicho)

Cada tenant nicho recebe via `niche-catalogs.ts` + `niche-operational.ts`:

- Catálogo de procedimentos (~15–19 por vertical)
- 3 prestadores com conselho/registro
- ~8 empresas parceiras + pacientes estrela
- Massa operacional (agenda histórica + futuro)
- VET: pets, vacinas, ficha clínica

| Nicho | Interno | Prestador | Beneficiário | PJ |
|-------|---------|-----------|--------------|-----|
| VET | `operacao@petcare.demo` | 1º provider catálogo | 1º star patient | `rh@techpet.demo` |
| DENTAL | `operacao@smile.demo` | idem | idem | config `pjEmail` |
| LEGAL | `operacao@lex.demo` | idem | idem | idem |
| SPA | `operacao@zen.demo` | idem | idem | idem |
| EDUCATION | `operacao@eduprime.demo` | idem | idem | idem |

Validação: `?tenant=petcare` → login bloqueia contas de outro tenant.

---

## Testes automatizados da massa

| Arquivo | O que valida |
|---------|--------------|
| `tests/helpers/seed-fixtures.ts` | E-mails/CPFs estáveis (João, Maria, Pedro, Helena) |
| `tests/lib/seed-mass-portal.test.ts` | Entidades mínimas **por portal** e **por segmento** |
| `tests/unit/seed-profile.test.ts` | Perfil `operation-1y` e glossário comum |
| `tests/security/tenant-isolation.test.ts` | Horizonte ≠ PetCare (cross-tenant 404) |
| `scripts/verify-databases.mjs` | Integridade pós-seed (`demo.db` + `operation.db`) |

```bash
# Testes usam SEED_SCALE=small + SEED_PROFILE=market (rápido)
npm run test

# Validar perfil operation-1y localmente
SEED_PROFILE=operation-1y SEED_SCALE=operation-1y npm run db:push && npm run db:seed
SEED_PROFILE=operation-1y npm run db:verify
```

---

## Volumes estimados

### Horizonte — `SEED_PROFILE=market` + `SEED_SCALE=medium`

| Entidade | Volume |
|----------|--------|
| Empresas PJ | 50 |
| Beneficiários | ~199 |
| Usuários PJ | ~27 (1/empresa) |
| Agendamentos | ~120+ bulk + 4 demo |
| Faturas | baseline 6m + PPU |

### Horizonte — `SEED_PROFILE=operation-1y`

| Entidade | Volume |
|----------|--------|
| Empresas PJ | 20 |
| Beneficiários | ~80–100 |
| Usuários PJ | ~48–144 (3–9 × 16 contratos) |
| Agendamentos | ~320 bulk + 4 demo |
| Faturas | baseline **12 meses** |

### Todos os tenants (demo completo)

| Agregado | Aproximado (`medium`) |
|----------|----------------------|
| Tenants | 7 |
| Empresas (todos) | 90–100 |
| Pacientes (todos) | 350–450 |
| Agendamentos (todos) | 400–500 |

---

## Lacunas conhecidas

| Lacuna | Status |
|--------|--------|
| E2E por segmento (petcare, smile…) | ❌ só Horizonte |
| `operation.db` com massa quente | ❌ só bootstrap |
| PetCare label `appointment` → "Banho/Tosa" no seed | ⚠️ documentado, não aplicado |
| Testes de carga com 20 clientes × 9 usuários | ❌ futuro |

---

## Referências

- Seed: `prisma/seed-data/run-seed.ts`
- Escala: `prisma/seed-data/scale.ts`
- Perfil: `prisma/seed-data/profile.ts`
- Segmentos: `docs/segmentos/README.md`
- Testes: `docs/plataforma/TESTES.md`
- Fixtures: `tests/helpers/seed-fixtures.ts`
