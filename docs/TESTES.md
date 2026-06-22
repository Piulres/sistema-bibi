# Estratégia de Testes Automatizados — Sistema Bibi

Mapa completo das camadas de teste, cobertura atual, lacunas de segurança e
próximos passos. Este documento expõe o que **não aparece na UI** nem no README.

---

## Pirâmide de testes

```
                    ┌─────────────┐
                    │  E2E (5)    │  Playwright — fluxos reais no browser
                    ├─────────────┤
                    │ API (7)     │  Handlers Next.js + auth/cron
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
| CI | GitHub Actions | `.github/workflows/ci.yml` | push/PR em `main` |

Banco de testes isolado: `prisma/test.db` (criado no primeiro `npm run test` com
`DATABASE_URL` apontando para ele — ver [setup](#setup-local-e-pitfalls) abaixo).

---

## Estrutura de pastas

```
tests/
├── setup.ts              # beforeAll: ensureTestDatabase()
├── helpers/
│   ├── db.ts             # test.db isolado (push + seed na 1ª execução)
│   └── request.ts        # jsonRequest() para Route Handlers
├── mocks/server-only.ts  # stub do pacote server-only no Vitest
├── unit/                 # lógica pura (password, pricing, proxy…)
├── security/             # RBAC gaps, MFA/HMAC
├── integration/          # Prisma + adapters (usa getTestPrisma)
└── api/                  # handlers importados diretamente (usa @/lib/db)

e2e/
└── smoke.spec.ts         # smoke + login + Pay Per Use

.github/workflows/ci.yml  # lint → vitest → build → playwright
vitest.config.ts          # env de teste (SESSION_SECRET, CRON_SECRET…)
playwright.config.ts      # dev server na porta 3100 (PLAYWRIGHT_PORT)
```

---

## Setup local e pitfalls

### Primeira execução

```bash
npm install
# Workaround: comente DATABASE_URL no .env (o Vitest carrega .env e sobrescreve o export)
DATABASE_URL=file:./prisma/test.db npm run test
```

O helper `ensureTestDatabase()` (`tests/helpers/db.ts`) cria `prisma/test.db` na
primeira rodada (`prisma db push` + `prisma db seed`). O arquivo é **gitignored**
e não interfere no `dev.db` de desenvolvimento.

### Pitfall: `.env` sobrescreve `DATABASE_URL`

O Vitest carrega `.env` do projeto. Se `DATABASE_URL=file:./dev.db` estiver definido
(como no `.env.example`), ele **prevalece** sobre `export DATABASE_URL=...` no shell.

| Ambiente | `DATABASE_URL` efetivo | Resultado |
|----------|------------------------|-----------|
| GitHub Actions CI | `file:./prisma/test.db` (workflow, sem `.env`) | ✅ 47 testes |
| Local com `.env` padrão | `file:./dev.db` | ⚠️ API tests falham se `dev.db` vazio ou sem seed |
| Local — workaround | comentar `DATABASE_URL` no `.env` e exportar `file:./prisma/test.db` | ✅ espelha o CI |

### Pitfall: singleton `db.ts` vs `beforeAll`

Testes de **integração** usam `getTestPrisma()` após `ensureTestDatabase()`.
Testes de **API** importam Route Handlers que carregam `prisma` de `src/lib/db.ts` no
**import do módulo** — o client Prisma é criado antes do seed de `test.db`. Por isso
os testes de API dependem de `test.db` **já existir e estar seedado** (criado pelo
próprio `npm run test` na primeira passagem dos testes de integração, ou manualmente
com `DATABASE_URL=file:./prisma/test.db npx prisma db push && ... db seed`).

### E2E (Playwright)

O `playwright.config.ts` sobe `npm run dev` na porta **3100** (não 3000). Antes
da primeira rodada E2E, popule o banco de dev:

```bash
npm run db:push && npm run db:seed
npm run test:e2e
```

No CI, o job `e2e` executa `db:push` + `db:seed` antes do Playwright.

---

## O que você **não vê** (lacunas e riscos)

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
| PJ overview/reports | ❌ |
| Beneficiário booking | ❌ E2E parcial (smoke) |
| LGPD export | ❌ (rota tem guard cadastros) |

### Enterprise

| Recurso | Teste |
|---------|-------|
| Webhooks dispatch/retry | ❌ |
| Lembretes cron | ✅ auth cron |
| Comunicação console | ❌ |
| Branding validation | ✅ unit |

---

## Mapa das 58 rotas API

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

## CI (GitHub Actions)

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

| Job | Etapas | Variáveis |
|-----|--------|-----------|
| `unit-integration-api` | `npm ci` → lint → test → build | `DATABASE_URL=file:./prisma/test.db`, `SESSION_SECRET`, `CRON_SECRET` |
| `e2e` | `db:push` + `db:seed` → Playwright Chromium | `CI=true`, `PLAYWRIGHT_PORT=3100` |

Dispara em **push** para `main` e branches `cursor/**`, e em **pull requests** para `main`.

---

## Comandos

```bash
```bash
# Vitest — comente DATABASE_URL no .env ou o Vitest usará dev.db
DATABASE_URL=file:./prisma/test.db npm run test

# Modo watch durante desenvolvimento
DATABASE_URL=file:./prisma/test.db npm run test:watch

# Cobertura
npm run test:coverage

# E2E (sobe dev server na porta 3100; exige dev.db seedado)
npm run test:e2e

# Espelha o job unit-integration-api do CI
npm run lint && DATABASE_URL=file:./prisma/test.db npm run test && npm run build
```

### Variáveis em testes

| Variável | Uso |
|----------|-----|
| `SESSION_SECRET` | HMAC de sessão e MFA challenge |
| `CRON_SECRET` | Proteção dos jobs cron |
| `DATABASE_URL` | `file:./prisma/test.db` em testes de integração |

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

---

## Referências

- Fluxos de negócio: [`FLUXOS.md`](FLUXOS.md)
- Arquitetura: [`ARQUITETURA.md`](ARQUITETURA.md)
- Evidências manuais: [`evidencias/`](evidencias/)
- CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
