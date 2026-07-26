# Estratégia de Testes Automatizados — Sistema Bibi - ServiceOS

Mapa completo das camadas de teste, cobertura atual, lacunas de segurança e
próximos passos. Este documento expõe o que **não aparece na UI** nem no README.

**Ground truth (jul/2026):** **587** casos Vitest (80 arquivos) · **12** specs Playwright · **~152** casos E2E (chromium + mobile) · **~160** Route Handlers · **123** paths no OpenAPI.

### Onboarding tour (v3)

| Caso | Arquivo | O que valida |
|------|---------|--------------|
| Match de rotas wildcard | `tests/unit/onboarding.test.ts` | `/interno/beneficiarios/*`, agenda* |
| Tour principal condensado | idem | ≤7 passos no dashboard interno |
| Micro-tour faturamento | idem | `page-billing`, `billing-cliente-360` |
| Micro-tour atendimento | idem | hotspot `atendimento-pep` |
| Persistência dismissed / routes | idem | `storage.ts` v3 |
| E2E isolamento | `e2e/helpers/auth.ts` | `skipOnboardingTours()` |

Doc: [`produto/ONBOARDING_TOUR.md`](../produto/ONBOARDING_TOUR.md)

---

## Matriz CRUD (obrigatório)

Toda entidade do mapa canônico (`src/lib/crud-operations-map.ts`, UI em
`/interno/cadastros?tab=operations`) deve ter teste automatizado que exercite
as operações suportadas (C/R/U/D).

| Camada | Onde | Papel |
|--------|------|--------|
| Registro | `tests/lib/crud-coverage-registry.ts` | Liga entidade → arquivos de teste |
| Gate | `tests/lib/crud-coverage.test.ts` | Falha se faltar entidade ou arquivo |
| API (preferido) | `tests/api/cadastros-crud.test.ts` · `tests/api/system-crud-matrix.test.ts` · demais `tests/api/*` | Happy path + RBAC leve |
| E2E (smoke UI) | `e2e/cadastros-crud.spec.ts` · `e2e/cedig-gestao.spec.ts` · `e2e/walkin-particular.spec.ts` | Confirma formulários e toasts |

**Regra para PRs:** nova entidade CRUD = entrada no mapa + entrada no registry +
teste API (E2E só se houver UI crítica). Validar com `npm run test`.

---

## Pirâmide de testes

```
                    ┌─────────────┐
                    │  E2E        │  Playwright — 12 specs (desktop + mobile)
                    ├─────────────┤
                    │ API         │  Handlers + auth/cron + exportações + cadastros
                    ├─────────────┤
                    │ Integração  │  Prisma + adapters mock
                    ├─────────────┤
                    │ Segurança   │  RBAC gaps, MFA/HMAC, proxy
                    ├─────────────┤
                    │ Unitário    │  Lógica pura (password, pricing, RBAC…)
                    └─────────────┘
```

| Camada | Runner | Pasta | Comando |
|--------|--------|-------|---------|
| Unitário | Vitest | `tests/unit/` | `npm run test` |
| Segurança | Vitest | `tests/security/` | `npm run test` |
| Integração | Vitest | `tests/integration/` | `npm run test` |
| API | Vitest | `tests/api/` | `npm run test` |
| E2E | Playwright | `e2e/` | `npm run test:e2e` |
| CI | GitHub Actions | `.github/workflows/ci.yml` | push/PR em `main`, `dev`, `cursor/**` |

Cobertura v2.0 ServiceOS: `tests/unit/niche.test.ts` — `getNicheConfig`, `mergeNicheLabels`, landing por nicho e catálogo do seed multi-nicho.

Cobertura v3.0.6 nav portais: `e2e/mobile-nav.spec.ts` — drawer nos 4 portais, menu **Mais** no interno desktop, landing mobile menu.

Cobertura v3.0.5 jornada PPU: `tests/lib/care-journey.test.ts` — `deriveCareJourneyBilling`, `resolveCareJourneyStep` (faturado/pago no prestador).

Cobertura v3.0.5 documentos clínicos: `tests/unit/documentos-clinicos.test.ts` — atestado CFM, receita comum/controle especial, protocolos de exames.

Banco de testes isolado: `prisma/test.db` (criado automaticamente no primeiro `npm run test`).

**Massa demo em testes:** `SEED_SCALE=small` via `tests/helpers/db.ts`. Fixtures estáveis em `tests/helpers/seed-fixtures.ts` (João, Maria, Pedro, prestador com CRM). O helper `isTestSeedStale()` re-seeda `test.db` quando a massa muda (ex.: conselho profissional, PEP tipado).

**Mapa completo da massa (perfis, portais, segmentos):** [`MASSA_TESTES.md`](MASSA_TESTES.md) — inclui perfil `operation-1y` (20 clientes, 3–9 usuários PJ, 1 ano).

**Inteligência de mercado e rotina diária por segmento:** [`docs/segmentos/INTELIGENCIA_OPERACIONAL_2026.md`](../segmentos/INTELIGENCIA_OPERACIONAL_2026.md)

**Massa rica multi-nicho:** todos os 5 tenants nicho recebem RBAC interno (3 usuários), estoque, perfil clínico, pricing B2B, baseline, webhooks e 3 personas estrela (PPU/PIX/particular). PetCare: label `Banho/Tosa`.

**Testes da massa por portal:** `tests/lib/seed-mass-portal.test.ts` · perfil `operation-1y`: `tests/unit/seed-profile.test.ts`

| Fixture | E-mail / CPF | Uso típico |
|---------|----------------|------------|
| João Pereira | `joao.pereira@email.com` / `111.222.333-44` | PEP, timeline, consumo pendente PPU |
| Maria Souza | `maria.souza@email.com` | Fatura FECHADA + PIX pendente |
| Pedro Almeida | `pedro.almeida@email.com` | Particular, fatura PAGA |
| Dra. Helena | `dra.helena@bibi.health` | Prestador com CRM/SP, export PEP |
| Build interno | `operacao@build.demo` | Obras + aprovar RDO/diária |
| Build pedreiro | `pedreiro.jose@build.demo` | Portal `/prestador/campo` |
| Build PJ | `rh@incorp.demo` | Aprovar proposta `OBR-2026-002` |

### Obras / Engenharia Civil

| Caso | O que valida |
|------|----------------|
| Labels `CONSTRUCTION` | Glossário Obra, Dossiê técnico, Vistoria |
| `listProjectsForCompany` | 3 obras Incorp Alpha no seed |
| `approveBudget` + PDF | Fatura emitida, buffer `%PDF` |
| `getProjectForCompany` | URLs de anexo PJ |
| API interno build | Lista, pipeline, detalhe, dependências, PDF, reject |
| API PJ Incorp | Lista, alerta overview, approve → invoice, PDF |
| Isolamento | MEDICAL interno lista vazia; TechCorp PJ sem obras/alertas |

Arquivos: `tests/unit/project.test.ts`, `tests/api/construction-projects.test.ts`

---

## O que você **não vê** (lacunas e riscos)

> **Auditoria completa (2026-06-22):** falhas mapeadas nos quatro portais com
> evidências de código, testes e `curl` — [`AUDITORIA_FLUXOS.md`](../produto/AUDITORIA_FLUXOS.md).

### 1. RBAC inconsistente entre UI e API

| Onde | Comportamento |
|------|---------------|
| **UI** (`interno-permissions.ts`) | Nav filtrada por perfil (READONLY só vê dashboard + relatórios) |
| **API** (maioria das rotas `/api/interno/*`) | Só exige `role === INTERNO` — **qualquer perfil** acessa billing, cadastros, PIX… |
| **Teste** | `tests/security/rbac-gaps.test.ts` documenta e falha se a correção for aplicada |

**Rotas com guard correto (`requireInternoModule`):** invoices POST, TISS, users, branding, webhooks, CRM status, export LGPD.

**Rotas expostas sem guard de módulo (exemplos):** `/interno/billing`, `/interno/procedures`, `/interno/invoices/[id]/pix`, `/interno/dashboard`.

> **Ação recomendada:** alinhar todas as rotas internas à matriz `INTERNO_PROFILES`.

### 2. Proxy só verifica presença do cookie

`src/proxy.ts` redireciona se **não há** cookie `bibi_session`. Um cookie forjado (`fake-token`) passa pelo proxy; a validação HMAC só ocorre no servidor (`session.ts`).

Teste: `tests/unit/proxy.test.ts` — documenta o comportamento intencional (otimista).

### 3. SESSION_SECRET padrão em dev

Se `SESSION_SECRET` não estiver definido, usa `bibi-poc-dev-secret-change-me`. Em produção isso **deve** ser sobrescrito. Os testes fixam um secret via `vitest.config.ts`.

### 4. Senha legada em plaintext

`password.ts` aceita hash sem prefixo `scrypt:` como comparação direta (migração). Risco se algum registro antigo existir.

Teste: `tests/unit/password.test.ts` — marca como comportamento documentado.

### 5. CRON_SECRET comparação simples

`/api/cron/*` usa `secret !== expected` (não timing-safe). Aceitável para secret longo, mas diferente do padrão HMAC das sessões.

Teste: `tests/api/auth-and-cron.test.ts`.

### 6. Isolamento multi-tenant

Queries Prisma usam `tenantId` na maioria dos serviços, mas **não há teste automatizado de cross-tenant** (prestador A acessando paciente B). Prioridade alta para integração.

### 7. MFA bypass em rotas sem segundo fator

Login com MFA retorna `mfaRequired` + token; rotas autenticadas não revalidam MFA a cada request (padrão de mercado, mas vale documentar).

---

## Mapa por domínio de negócio

### Pay Per Use (receita)

| Etapa | Módulo | Teste atual | Próximo |
|-------|--------|-------------|---------|
| Precificação dinâmica | `pricing.ts` | ✅ unit + integração DB | Regras edge (multiplier 0, arredondamento) |
| Uso de procedimento | `prestador/.../procedures` | ❌ | API + E2E |
| Faturamento | `invoice-service.ts` | ❌ | Integração transacional |
| PIX mock | `mock-pix-adapter.ts` | ✅ integração | confirm-pix round-trip |
| TISS XML | `tiss-service.ts` | ✅ `tests/api/tiss-guide.test.ts` (5 casos: 200, 422 NO_ITEMS, 403, 404, escapeXml) | Snapshot XSD (Tier 5) |

### Autenticação e sessão

| Etapa | Teste |
|-------|-------|
| scrypt hash/verify | ✅ `password.test.ts` |
| Login API (portal, credenciais) | ✅ `auth-and-cron.test.ts` |
| MFA TOTP + challenge HMAC | ✅ `mfa-tokens.test.ts` |
| Cookie session HMAC | ⚠️ indireto via MFA (mesmo algoritmo) |
| Logout / me | ❌ |

### RBAC interno

| Perfil | Módulos UI | APIs protegidas |
|--------|------------|-----------------|
| ADMIN | todos | parcial |
| FATURAMENTO | billing, subscriptions… | invoices POST ✅, billing GET ❌ |
| RECEPCAO | agenda, cadastros… | appointments ✅ (só role) |
| READONLY | dashboard, relatórios | **pode chamar billing via API** |

### Portais B2B / beneficiário

| Fluxo | Teste |
|-------|-------|
| PJ overview/reports | ✅ `portal-flows.test.ts` |
| Beneficiário booking | ✅ E2E parcial (`flows`, `walkin-particular`) |
| Exportações PDF/Excel | ✅ `exports.test.ts` (PEP, faturas, auditoria, portais) |
| LGPD export JSON | ✅ `exports.test.ts` + guard cadastros |

### Enterprise

| Recurso | Teste |
|---------|-------|
| Webhooks dispatch/retry | ❌ |
| Lembretes cron | ✅ auth cron |
| Comunicação console | ❌ |
| Branding validation | ✅ unit |

---

## Mapa das rotas API

**FATO:** existem **160** Route Handlers em `src/app/api/`. O contrato OpenAPI documenta **123** paths (sync automático via `openapi:sync`). **37** handlers ainda sem path no YAML — `openapi:verify` emite aviso (não falha); ver [`API_DOCS.md`](API_DOCS.md) §5.

Legenda: 🔒 = `requireInternoModule` | 🔑 = `requireUser` | 🌐 = público | ⏰ = CRON_SECRET

### Auth (público / sessão)
- `POST /api/auth/login` — 🌐 ✅ testado
- `POST /api/auth/logout` — sessão
- `GET /api/auth/me` — sessão
- `GET/POST /api/auth/mfa/setup` — sessão
- `POST /api/auth/mfa/verify` — 🌐

### Cron
- `POST /api/cron/reminders` — ⏰ ✅ testado
- `POST /api/cron/webhooks` — ⏰

### Prestador (5 rotas) — 🔑 PRESTADOR
- agenda, appointments, procedures, records

### Interno (38 rotas) — 🔑 INTERNO (9 com 🔒)
- Ver `tests/security/rbac-gaps.test.ts` para lista dinâmica

### PJ (2) — 🔑 PJ
### Beneficiário (5) — 🔑 BENEFICIARIO
### Compartilhado (2) — procedures, branding/logo

Contrato OpenAPI: `public/openapi.yaml` — Swagger UI em `/api/docs` (ver [`API_DOCS.md`](API_DOCS.md)).

---

## Comandos

```bash
# Todos os testes Vitest (unit + security + integration + api)
npm run test

# Modo watch durante desenvolvimento
npm run test:watch

# E2E (sobe dev server na porta 3100)
npm run test:e2e

# Lint + test + build (espelha CI local)
npm run lint && npm run test && npm run build
```

### Setup e gotchas de execução (VM/dev nova)

Atalho de onboarding — em VM nova, após `npm install`:

```bash
npm run setup   # cria .env, prisma db push + seed condicional (idempotente, não destrutivo)
```

Gotchas confirmados em runtime (jul/2026):

| Sintoma | Causa | Resolução |
|---------|-------|-----------|
| `npm run test:e2e` falha com **"Another next dev server is already running"** | Next 16 permite **um** `next dev` por diretório de projeto; Playwright sobe o próprio dev server (porta 3100) | **Pare o `npm run dev`** antes de rodar e2e (o Playwright inicia e derruba o dele) |
| E2E aborta com `browserType.launch: Executable doesn't exist` | Browser do Playwright não baixado na VM | `npx playwright install chromium` (uma vez por VM) |
| Login retorna **500 `The table main.User does not exist`** após `npm run test` | O teste de dual-store gravava `prisma/.data-store-mode=operation`, apontando o dev para `operation.db` (vazio) | Corrigido no `afterEach` do teste; se ainda ocorrer: `rm -f prisma/.data-store-mode prisma/operation.db` (ou `npm run setup`) |
| `/interno/gestao` 500 em produção (`no such column`) | Blob de operação com schema defasado vs artefato de build | Pacote ≥ v3.0.2 aplica `schema-sync` no boot; ver [`OPERACAO_DADOS.md`](OPERACAO_DADOS.md) §Schema-sync |
| RBAC/regras via `curl` retornam 401 mesmo com login | Cookie de sessão não salvo — resposta de login pode ser 500 se o banco não estiver populado | Rode `npm run setup`; use `-c/-b` do curl no mesmo arquivo de cookies |

### Variáveis em testes

Mapa completo: [`VARIAVEIS_AMBIENTE.md`](VARIAVEIS_AMBIENTE.md) (seções CI, Vitest e Playwright).

| Variável | Uso |
|----------|-----|
| `SESSION_SECRET` | HMAC de sessão e MFA challenge |
| `CRON_SECRET` | Proteção dos jobs cron |
| `DATABASE_URL` | `file:./prisma/test.db` em testes de integração |
| `PAYMENT_GATEWAY` | `mock` (default Vitest) |
| `COMMUNICATION_PROVIDER` | `console` (default Vitest) |
| `CI` / `PLAYWRIGHT_PORT` | E2E Playwright |

---

## Roadmap sugerido (prioridade)

1. **P0 — Segurança:** `requireInternoModule` em todas as rotas internas sensíveis + testes de negação por perfil
2. **P0 — Multi-tenant:** testes cross-tenant em appointments, patients, invoices
3. **P1 — Receita:** fluxo E2E completo procedimento → fatura → PIX → confirm
4. **P1 — Contrato:** validar respostas contra `openapi.yaml` (ex.: `@apidevtools/swagger-parser`)
5. **P2 — Componentes:** Testing Library para `BillingView`, `AtendimentoView`
6. **P2 — Webhooks:** integração com fila de retry
7. **P3 — Performance:** smoke de carga em `computePrice` e dashboard KPIs

---

## Credenciais para E2E / manual

Senha única: `bibi123`

| Portal | E-mail |
|--------|--------|
| Prestador | `dra.helena@bibi.health` |
| Interno (admin) | `faturamento@bibi.health` |
| Interno (recepção) | `recepcao@bibi.health` |
| MFA demo | `seguranca@bibi.health` |
| PJ | `rh@techcorp.com` |
| Beneficiário | `joao.pereira@email.com` |
| Beneficiário (particular) | `pedro.almeida@email.com` |
| Build interno | `operacao@build.demo` |
| Build PJ (Incorp Alpha) | `rh@incorp.demo` |

### Specs E2E (`e2e/`)

| Arquivo | Cobertura |
|---------|-----------|
| `smoke.spec.ts` | Landing, logins, credencial inválida |
| `flows.spec.ts` | Proxy, PJ, beneficiário, prestador, logout |
| `interno-modules.spec.ts` | Módulos interno (nav `INTERNO_NAV_TABS` — **sem** `/interno/gestao`) |
| `rbac.spec.ts` | RECEPCAO e FATURAMENTO — nav e bloqueios |
| `walkin-particular.spec.ts` | Walk-in, check-in, mapa CRUD e filtro portal |
| `cedig-gestao.spec.ts` | Piloto CEDIG — gestão clínica, lançamentos, ponte PPU |
| `cadastros-crud.spec.ts` | Smoke UI CRUD cadastros |
| `assistant.spec.ts` | Assistente operacional serverless |
| `api-docs.spec.ts` | Swagger UI `/api-docs` |
| `flow-improvements.spec.ts` | Melhorias de fluxo multi-portal |
| `interno-reports.spec.ts` | Relatórios interno |
| `mobile-nav.spec.ts` | Navegação mobile drawer |

---

## CI (GitHub Actions)

Pipeline em `.github/workflows/ci.yml` — dois jobs sequenciais:

1. **unit-integration-api** — `lint` → `docs:verify` → `openapi:verify` → `db:bootstrap:demo` → `db:verify` → `test` → `build`
2. **e2e** — `db:bootstrap:demo` → Playwright (`CI=true`, porta `3100`)

**Variáveis globais do workflow** (obrigatórias — Prisma falha sem `DATABASE_URL`):

| Variável | Valor CI |
|----------|----------|
| `DATABASE_URL` | `file:./dev.db` (relativo ao `schema.prisma`) |
| `SESSION_SECRET` | secret de 32+ chars para testes |
| `CRON_SECRET` | secret de 32+ chars para testes |
| `SEED_SCALE` | `small` (seed rápido) |

**Espelhar CI localmente:**

```bash
npm run lint && npm run docs:verify && npm run openapi:verify
SEED_SCALE=small npm run db:bootstrap:demo && npm run db:verify
npm run test && npm run build
CI=true npm run test:e2e
```

`npm run pre-release` executa o mesmo bootstrap antes de `db:verify` (espelha CI + Netlify build).

> Não usar `db:push && db:seed` no CI — `db:verify` exige `demo.db` + `operation.db` (dual-store).

---

## Referências

- Fluxos de negócio: [`FLUXOS.md`](../produto/FLUXOS.md)
- Auditoria de falhas por portal: [`AUDITORIA_FLUXOS.md`](../produto/AUDITORIA_FLUXOS.md)
- Arquitetura: [`ARQUITETURA.md`](ARQUITETURA.md)
- Evidências manuais: [`../evidencias/`](../evidencias/)
- CI: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)
