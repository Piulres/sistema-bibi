# Estratégia de Testes Automatizados — Sistema Bibi - ServiceOS

Mapa completo das camadas de teste, cobertura atual, lacunas de segurança e
próximos passos. Este documento expõe o que **não aparece na UI** nem no README.

**Ground truth (jun/2026):** **403** casos Vitest · **128** testes Playwright E2E (10 specs × 2 projetos) · **~121** Route Handlers · **73** paths no OpenAPI (`public/openapi.yaml`).

---

## Pirâmide de testes

```
                    ┌─────────────┐
                    │  E2E        │  Playwright — 10 specs (desktop + mobile)
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

Cobertura v2.0 ServiceOS: `tests/unit/niche.test.ts` — `getNicheConfig`, `mergeNicheLabels`, landing por nicho e catálogo do seed multi-nicho.

Cobertura v2.2 onboarding: `tests/unit/onboarding.test.ts` — `matchesRoute`, `buildTourSteps` por portal, labels dinâmicos, parse de `bibi_onboarding`.
| Segurança | Vitest | `tests/security/` | `npm run test` |
| Integração | Vitest | `tests/integration/` | `npm run test` |
| API | Vitest | `tests/api/` | `npm run test` |
| E2E | Playwright | `e2e/` | `npm run test:e2e` |
| CI | GitHub Actions | `.github/workflows/ci.yml` | push/PR em `main`, `dev`, `cursor/**` |

Banco de testes isolado: `prisma/test.db` (criado automaticamente no primeiro `npm run test`).

**Massa demo em testes:** `SEED_SCALE=small` via `tests/helpers/db.ts`. Fixtures estáveis em `tests/helpers/seed-fixtures.ts` (João, Maria, Pedro, prestador com CRM). O helper `isTestSeedStale()` re-seeda `test.db` quando a massa muda (ex.: conselho profissional, PEP tipado).

| Fixture | E-mail / CPF | Uso típico |
|---------|----------------|------------|
| João Pereira | `joao.pereira@email.com` / `111.222.333-44` | PEP, timeline, consumo pendente PPU |
| Maria Souza | `maria.souza@email.com` | Fatura FECHADA + PIX pendente |
| Pedro Almeida | `pedro.almeida@email.com` | Particular, fatura PAGA |
| Dra. Helena | `dra.helena@bibi.health` | Prestador com CRM/SP, export PEP |

---

## O que você **não vê** (lacunas e riscos)

> **Auditoria completa (2026-06-22):** falhas mapeadas nos quatro portais com
> evidências de código, testes e `curl` — [`AUDITORIA_FLUXOS.md`](AUDITORIA_FLUXOS.md).

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
| TISS XML | `tiss-service.ts` | ❌ | Snapshot XML |

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
| Onboarding tour (builders, rotas, storage) | ✅ `onboarding.test.ts` |
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

**FATO:** existem **~100** Route Handlers em `src/app/api/`. O contrato OpenAPI documenta **58** paths — subconjunto intencional para integradores.

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

Contrato OpenAPI: `public/openapi.yaml` — candidato a testes de contrato (não implementado).

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

### Specs E2E (`e2e/`)

| Arquivo | Cobertura |
|---------|-----------|
| `smoke.spec.ts` | Landing, logins, credencial inválida |
| `flows.spec.ts` | Proxy, PJ, beneficiário, prestador, logout |
| `interno-modules.spec.ts` | **13** módulos interno (nav `INTERNO_NAV_TABS`) |
| `rbac.spec.ts` | RECEPCAO e FATURAMENTO — nav e bloqueios |
| `walkin-particular.spec.ts` | Walk-in, check-in, mapa CRUD e filtro portal |

---

## CI (GitHub Actions)

Pipeline em `.github/workflows/ci.yml` — dois jobs sequenciais:

1. **unit-integration-api** — `lint` → `docs:verify` → `db:bootstrap:demo` → `db:verify` → `test` → `build`
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
npm run lint && npm run docs:verify
SEED_SCALE=small npm run db:bootstrap:demo && npm run db:verify
npm run test && npm run build
CI=true npm run test:e2e
```

`npm run pre-release` executa o mesmo bootstrap antes de `db:verify` (espelha CI + Netlify build).

> Não usar `db:push && db:seed` no CI — `db:verify` exige `demo.db` + `operation.db` (dual-store).

---

## Referências

- Fluxos de negócio: [`FLUXOS.md`](../produto/FLUXOS.md)
- Auditoria de falhas por portal: [`AUDITORIA_FLUXOS.md`](AUDITORIA_FLUXOS.md)
- Arquitetura: [`ARQUITETURA.md`](ARQUITETURA.md)
- Evidências manuais: [`../evidencias/`](../evidencias/)
- CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
