# Estratégia de Testes Automatizados — Sistema Bibi - ServiceOS

Mapa completo das camadas de teste, cobertura atual, lacunas de segurança e
próximos passos. Este documento expõe o que **não aparece na UI** nem no README.

**Ground truth (jul/2026):** **598+** casos Vitest (83+ arquivos) · **14** specs Playwright · **156+** casos E2E (chromium + mobile) · **163** Route Handlers · **123** paths no OpenAPI (40 handlers sem YAML — ver `npm run openapi:verify`). Revalidar com `npx vitest run` e `npm run openapi:verify` após adicionar testes.

### Títulos e CI Summary (obrigatório)

Todo teste novo ou alterado deve ter título **WHAT + WHY** — o Job Summary do GitHub Actions é a primeira leitura do revisor.

| Camada | Onde | O que aparece no CI |
|--------|------|---------------------|
| Vitest | `vitest.config.ts` | reporters `default` + `github-actions` + `junit` → `reports/vitest-junit.xml` |
| Summary | `scripts/ci-vitest-summary.mjs` | tabela passou/falhou + suites no `$GITHUB_STEP_SUMMARY` |
| Playwright | `playwright.config.ts` | `github` + `html` + `junit`; artefatos em falha |

Regra Cursor: `.cursor/rules/tests.mdc` · checklist skill: `references/CHECKLIST.md`.

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
                    │  E2E        │  Playwright — 14 specs (desktop + mobile)
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

Cobertura v3.0.7 exports: `tests/unit/export-formats.test.ts` (formatos canônicos, BOM UTF-8 via `arrayBuffer`, TXT pipe-delimited) · `tests/unit/interchange.test.ts` (dataset canônico CSV/JSON) · `tests/api/exports.test.ts` · `tests/api/portal-flows.test.ts` (CSV PJ tabular).

Cobertura v3.0.6/v3.0.7 nav portais: `e2e/mobile-nav.spec.ts` — landing drawer, drawer nos 4 portais (painel à direita desde v3.0.7), menu **Mais** no interno desktop (aba secundária pinada na faixa). Helpers: `expectInternoNavHref` / `openInternoNav` em `e2e/helpers/auth.ts` — usados também em `interno-modules.spec.ts` e `rbac.spec.ts`.

Cobertura v3.0.5 jornada PPU: `tests/lib/care-journey.test.ts` — `deriveCareJourneyBilling`, `resolveCareJourneyStep` (faturado/pago no prestador).

Cobertura jornada consultório (v3.0.8+): `tests/api/consultorio-journey.test.ts` — Atos 1–4 (walk-in → check-in → PEP → procedimento/estoque → REALIZADO → fatura PIX/marcar paga) + RBAC cadastros/estoque · doc [`JORNADA_CONSULTORIO.md`](../produto/JORNADA_CONSULTORIO.md).

Cobertura v3.0.24 brand/nav: `tests/unit/brand-mark.test.ts` — gradiente whitelabel, mesh hero, SVG circular · `NavOverflowMenu` portaled (#370) · doc [`BRANDING.md`](BRANDING.md).

Cobertura v3.0.26/v3.0.27 BrandMark home: `tests/unit/brand-mark.test.ts` — `markText` "Bibi" na plataforma (`PLATFORM.brandMark`), `backgroundColor` fallback em `brandMarkMeshStyle`, `brandMarkThemeMeshStyle` com CSS vars (`useThemeColors` na landing) · doc [`BRANDING.md`](BRANDING.md) §Mesh visível.

Cobertura v3.0.24 portal PJ import: `tests/api/pj-beneficiaries-import.test.ts` — template CSV + dry-run + import na empresa logada · `POST /api/pj/beneficiaries/import`.

Cobertura v3.0.23 portal PJ: `tests/api/pj-beneficiaries.test.ts` — CRUD colaboradores (`POST/PATCH/DELETE /api/pj/beneficiaries`) com anti-IDOR `companyId` · mapa `pj-beneficiary-crud` em `flow-improvements-map.ts` · doc [`FLUXOS.md`](../produto/FLUXOS.md) §5 · [`API_DOCS.md`](API_DOCS.md) §10.

Cobertura v3.0.23 estoque UI: `e2e/estoque-fases.spec.ts` — smoke abas Resumo/Produtos/Lotes/Movimentos (fases 1–4): combobox status de lote, tipos manuais restritos (SAIDA/AJUSTE/PERDA) e botão Reverter.

Cobertura v3.0.5 documentos clínicos: `tests/unit/documentos-clinicos.test.ts` — atestado CFM, receita comum/controle especial, protocolos de exames.

Banco de testes isolado: `prisma/test.db` (criado automaticamente no primeiro `npm run test`).

**Massa demo em testes:** `SEED_SCALE=small` via `tests/helpers/db.ts`. Fixtures estáveis em `tests/helpers/seed-fixtures.ts` (João, Maria, Pedro, prestador com CRM). O helper `isTestSeedStale()` re-seeda `test.db` quando a massa muda (ex.: conselho profissional, PEP tipado).

**Mapa completo da massa (perfis, portais, segmentos):** [`MASSA_TESTES.md`](MASSA_TESTES.md) — inclui perfil `operation-1y` (20 clientes, 3–9 usuários PJ, 1 ano).

**Inteligência de mercado e rotina diária por segmento:** [`docs/segmentos/INTELIGENCIA_OPERACIONAL_2026.md`](../segmentos/INTELIGENCIA_OPERACIONAL_2026.md)

**Massa rica multi-nicho:** todos os 5 tenants nicho recebem RBAC interno (3 usuários), estoque, perfil clínico, pricing B2B, baseline, webhooks e 3 personas estrela (PPU/PIX/particular). PetCare: label `Banho/Tosa`.

**Testes da massa por portal:** `tests/lib/seed-mass-portal.test.ts` · perfil `operation-1y`: `tests/unit/seed-profile.test.ts` · mês operacional (~30 dias, timeline sempre atual): `tests/unit/operation-month-plan.test.ts` + `tests/lib/operation-month-consistency.test.ts` · doc [`MASSA_TESTES.md`](MASSA_TESTES.md)

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

### 1. RBAC interno — API alinhada à matriz UI (corrigido v3.0.3+)

| Onde | Comportamento |
|------|---------------|
| **UI** (`interno-permissions.ts`) | Nav filtrada por perfil (READONLY só vê dashboard + relatórios) |
| **API** (`/api/interno/*`) | **96/96** Route Handlers usam `requireInternoModule` ou `requireInternoAdmin` — perfil sem módulo → **403** |
| **Teste** | `tests/security/rbac-gaps.test.ts` falha se alguma rota interna ficar sem guard de módulo |

**Guards de escrita (v3.0.22 · Fase 5):** mutações POST/PATCH/PUT/DELETE usam `requireInternoModuleWrite` (ou `requireInternoAdmin`); GET permanece em `requireInternoModule`. Inventário: `tests/security/rbac-gaps.test.ts` + `tests/api/interno-write-guards.test.ts`. Ver [`AUDITORIA_FLUXOS.md`](../produto/AUDITORIA_FLUXOS.md) §5.

**Exceção documentada:** `GET /api/procedures` — catálogo compartilhado (`requireUser` sem módulo interno; impacto baixo).

### 2. Proxy valida presença e assinatura HMAC do cookie

`src/proxy.ts` redireciona para login se o cookie `bibi_session` estiver ausente **ou** com assinatura inválida (`verifySessionToken`). Cookie forjado (`fake-token`) é rejeitado no proxy — teste em `tests/unit/proxy.test.ts`. Role e RBAC continuam validados apenas no servidor (Server Components e Route Handlers).

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
| ADMIN | todos | ✅ `requireInternoModule` em todas as rotas internas |
| FATURAMENTO | billing, subscriptions… | ✅ billing/invoices — ❌ cadastros (403) |
| RECEPCAO | agenda, cadastros… | ✅ cadastros/agenda — ❌ billing (403) |
| READONLY | dashboard, relatórios | ✅ só módulos da matriz — ❌ billing/cadastros (403) |

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

**FATO:** existem **163** Route Handlers em `src/app/api/`. O contrato OpenAPI documenta **123** paths (sync automático via `openapi:sync`). **40** handlers ainda sem path no YAML — `openapi:verify` emite aviso (não falha); inventário por domínio em [`API_DOCS.md`](API_DOCS.md) §5.1 (gestão clínica §8, obras construction README).

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

### Prestador (34 rotas) — 🔑 PRESTADOR
- agenda, appointments, procedures, records, documentos clínicos, exports, pets (VET)

### Interno (96 rotas) — 🔑 INTERNO + 🔒 `requireInternoModule` em todas
- Ver `tests/security/rbac-gaps.test.ts` para inventário dinâmico

### PJ (7 rotas) — 🔑 PJ
- overview, reports, construction, projects

### Beneficiário (14 rotas) — 🔑 BENEFICIARIO
- overview, booking, invoices/PIX, export, projects (construction)

### Outros (12 rotas)
- `auth` (5) · `cron` (2) · `assistant` (2) · `segment/persist` (1) · `procedures` (1) · `branding/logo` (1)

Contrato OpenAPI: `public/openapi.yaml` — Swagger UI em `/api/docs` (ver [`API_DOCS.md`](API_DOCS.md)).

### Páginas App Router (por portal)

Contagem de `page.tsx` — distinto das abas na nav (detalhe em [`FLUXOS.md`](../produto/FLUXOS.md) §11):

| Portal | Páginas | Notas |
|--------|--------:|-------|
| Prestador | 8 | dashboard, pacientes, atendimento, campo, extrato, relatórios |
| Interno | 21 | 14–15 nav + login + cliente 360° + projetos/* + faturamento |
| PJ | 4 | overview, projetos, login |
| Beneficiário | 15 | 11 nav + obras (CONSTRUCTION) + login |

Revalidar: `for p in prestador interno pj beneficiario; do echo -n "$p: "; find src/app/$p -name page.tsx | wc -l; done`

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
| `npm run setup` falha com `unknown option: --skip-generate` | Versões recentes do Prisma CLI não aceitam `--skip-generate` em `db push` | Atualize o repo (`scripts/dev-setup.mjs` usa `npx prisma db push` sem flags extras) |
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

1. ~~**P0 — Segurança:** generalizar `requireInternoModuleWrite` nas rotas mutáveis~~ ✅ **v3.0.22** — `rbac-gaps.test.ts` · `interno-write-guards.test.ts`
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
| `interno-modules.spec.ts` | Módulos interno via `expectInternoNavHref` (faixa + menu **Mais** + drawer) — **sem** `/interno/gestao` |
| `rbac.spec.ts` | RECEPCAO e FATURAMENTO — presença/ocultação de módulos no nav (`expectInternoNavHref`) |
| `walkin-particular.spec.ts` | Walk-in, check-in, mapa CRUD e filtro portal |
| `jornada-consultorio.spec.ts` | Jornada operacional UI — agenda/estoque/cadastros/faturamento + walk-in→check-in→atendimento (PEP/procedimentos/stepper) · doc [`JORNADA_CONSULTORIO.md`](../produto/JORNADA_CONSULTORIO.md) |
| `estoque-fases.spec.ts` | Smoke UI estoque fases 1–4 — abas Resumo/Produtos/Lotes/Movimentos; tipos manuais SAIDA/AJUSTE/PERDA; Reverter (login `recepcao@bibi.health`) |
| `cedig-gestao.spec.ts` | Piloto CEDIG — gestão clínica, lançamentos, ponte PPU, prefill agenda→gestão, KPIs dashboard (`dashboard-billing-kpis`); **mobile** (390×844) sem overflow horizontal (`clinic-finance-root`) |
| `cadastros-crud.spec.ts` | Smoke UI CRUD cadastros |
| `assistant.spec.ts` | Assistente operacional serverless |
| `api-docs.spec.ts` | Swagger UI `/api-docs` |
| `flow-improvements.spec.ts` | Melhorias de fluxo multi-portal |
| `interno-reports.spec.ts` | Relatórios interno |
| `mobile-nav.spec.ts` | Landing drawer + nav responsiva nos 4 portais (drawer `< lg`, menu **Mais** desktop, pin de aba secundária) |

### Helpers E2E — portal nav (`e2e/helpers/auth.ts`)

Padrão para testar a nav redesenhada (v3.0.6) sem duplicar lógica do menu **Mais**:

| Helper | Uso |
|--------|-----|
| `internoNav(page)` | Faixa desktop — `getByRole('navigation', { name: 'Navegação por abas' })` |
| `internoNavDrawer(page)` | Drawer mobile — `getByRole('navigation', { name: 'Módulos internos' })` |
| `openInternoNav(page)` | Retorna faixa desktop ou abre drawer via gatilho “Navegação” |
| `expectInternoNavHref(page, href, present)` | Valida link na faixa, no menu **Mais** (`menu` “Mais módulos”) ou no drawer |
| `portalMain(page)` | Escopo `.portal-page-content` — evita asserts em header/nav ocultos |

**Pitfall:** módulos `priority: "secondary"` não aparecem na faixa até serem abertos pelo menu **Mais**; após navegação, a aba ativa fica pinada na faixa (`mobile-nav.spec.ts`).

**Pitfall (drawer prestador, v3.0.7):** categorias (`group`) usam `<p>` para o rótulo e `<a>` para o módulo — o mesmo texto (ex.: "Agenda") aparece duas vezes. Use `getByRole("paragraph").filter({ hasText: /^Agenda$/ })` para o cabeçalho e `getByRole("link", { name: "Agenda" })` para clicar; `getByText("Agenda")` falha em strict mode. Gatilho: `[data-tour-id="mobile-nav-trigger"]` (tour onboarding — **não** `data-cursor-id`); painel `role="dialog"` à direita (`boundingBox`). Ver `e2e/mobile-nav.spec.ts`.

**Contrato aria-label por portal** (Prestador, Beneficiário, PJ): [`produto/ARQUITETURA_PORTAIS.md`](../produto/ARQUITETURA_PORTAIS.md) §Navegação → Contrato a11y para E2E.

Doc de componentes: [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) · [`produto/ARQUITETURA_PORTAIS.md`](../produto/ARQUITETURA_PORTAIS.md) §Navegação.

---

## CI (GitHub Actions)

Pipeline em `.github/workflows/ci.yml` — dois jobs sequenciais:

1. **unit-integration-api** — `lint` → `docs:verify` → `openapi:verify` → `db:bootstrap:demo` → `db:verify` → `test` → `build`
2. **e2e** — `db:bootstrap:demo` → Playwright (`CI=true`, porta `3100`)

**Runtime CI:** Node **24** · `actions/checkout@v6` · `actions/setup-node@v6`.

**Otimização `test.db`:** o job unitário usa `DATABASE_URL=file:./test.db`. O helper `tests/helpers/db.ts` grava `prisma/.test-db-ready` com fingerprint de schema + seed; nos workers, `ensureTestDatabase()` pula subprocessos `prisma db push` quando o marker é válido (suíte ~112s → ~30s em runners lentos). Invalida ao mudar `schema.prisma` ou arquivos em `prisma/seed-data/`.

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
