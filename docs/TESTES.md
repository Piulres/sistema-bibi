# Estratégia de Testes Automatizados — Sistema Bibi

Mapa completo das camadas de teste, cobertura atual, lacunas de segurança e
próximos passos. Este documento expõe o que **não aparece na UI** nem no README.

---

## Pirâmide de testes

```
                    ┌─────────────┐
                    │  E2E (41)   │  Playwright — 5 specs (smoke, flows, interno, rbac, walk-in)
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

Banco de testes isolado: `prisma/test.db` (criado automaticamente no primeiro `npm run test`).

---

## O que você **não vê** (lacunas e riscos)

> **Auditoria completa (2026-06-22):** falhas mapeadas nos quatro portais com
> evidências de código, testes e `curl` — [`AUDITORIA_FLUXOS.md`](AUDITORIA_FLUXOS.md).

### 1. Care Chart (v1.1.0) — sem testes automatizados

O módulo clínico em produção (`v1.1.0`, PR #86) expõe **14 Route Handlers** em
`/api/prestador/patients/*`, `/api/prestador/medications|exam-orders|protocols/*`,
`/api/interno/patients/[id]/clinical`, `/api/interno/protocol-templates/*` e
`/api/beneficiario/clinical`. Nenhum spec Vitest ou Playwright cobre esses fluxos.

| Área | Rotas | Teste atual |
|------|-------|-------------|
| Perfil clínico | `GET|PUT .../clinical-profile` | ❌ |
| Medicação | `GET|POST .../medications`, `PATCH .../medications/[id]` | ❌ |
| Exames | `GET|POST .../exam-orders`, `PATCH .../exam-orders/[id]` | ❌ |
| Protocolos | `GET|POST .../protocols`, `PATCH .../protocols/[id]` | ❌ |
| Visão interna/beneficiário | `GET .../clinical` | ❌ |
| Templates interno | `GET|POST|PATCH .../protocol-templates` | ❌ |

**Massa demo:** `prisma/seed-data/clinical-demo.ts` (João Pereira — alergia Dipirona, Losartana, HbA1c, protocolo HAS).

> **Ação recomendada:** API tests para CRUD prestador + negação cross-tenant; E2E smoke em `/prestador/atendimento/[id]` com sidebar clínica.

### 2. RBAC inconsistente entre UI e API

| Onde | Comportamento |
|------|---------------|
| **UI** (`interno-permissions.ts`) | Nav filtrada por perfil (READONLY só vê dashboard + relatórios) |
| **API** (maioria das rotas `/api/interno/*`) | Só exige `role === INTERNO` — **qualquer perfil** acessa billing, cadastros, PIX… |
| **Teste** | `tests/security/rbac-gaps.test.ts` documenta e falha se a correção for aplicada |

**Rotas com guard correto (`requireInternoModule`):** invoices POST, TISS, users, branding, webhooks, CRM status, export LGPD.

**Rotas expostas sem guard de módulo (exemplos):** `/interno/billing`, `/interno/procedures`, `/interno/invoices/[id]/pix`, `/interno/dashboard`.

> **Ação recomendada:** alinhar todas as rotas internas à matriz `INTERNO_PROFILES`.

### 3. Proxy só verifica presença do cookie

`src/proxy.ts` redireciona se **não há** cookie `bibi_session`. Um cookie forjado (`fake-token`) passa pelo proxy; a validação HMAC só ocorre no servidor (`session.ts`).

Teste: `tests/unit/proxy.test.ts` — documenta o comportamento intencional (otimista).

### 4. SESSION_SECRET padrão em dev

Se `SESSION_SECRET` não estiver definido, usa `bibi-poc-dev-secret-change-me`. Em produção isso **deve** ser sobrescrito. Os testes fixam um secret via `vitest.config.ts`.

### 5. Senha legada em plaintext

`password.ts` aceita hash sem prefixo `scrypt:` como comparação direta (migração). Risco se algum registro antigo existir.

Teste: `tests/unit/password.test.ts` — marca como comportamento documentado.

### 6. CRON_SECRET comparação simples

`/api/cron/*` usa `secret !== expected` (não timing-safe). Aceitável para secret longo, mas diferente do padrão HMAC das sessões.

Teste: `tests/api/auth-and-cron.test.ts`.

### 7. Isolamento multi-tenant

Queries Prisma usam `tenantId` na maioria dos serviços, mas **não há teste automatizado de cross-tenant** (prestador A acessando paciente B). Prioridade alta para integração.

### 8. MFA bypass em rotas sem segundo fator

Login com MFA retorna `mfaRequired` + token; rotas autenticadas não revalidam MFA a cada request (padrão de mercado, mas vale documentar).

---

## Mapa por domínio de negócio

### Care Chart (v1.1.0)

| Etapa | Módulo | Teste atual | Próximo |
|-------|--------|-------------|---------|
| Perfil clínico | `clinical-profile-service.ts` | ❌ | API CRUD + JSON allergies |
| Prescrições | `medication-service.ts` | ❌ | Status machine + timeline |
| Pedidos de exame | `exam-order-service.ts` | ❌ | Workflow SOLICITADO→LAUDADO |
| Protocolos | `care-protocol-service.ts` | ❌ | Checklist + templates |
| UI prestador | `ClinicalCarePanel` | ❌ | E2E sidebar no atendimento |

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
| Beneficiário booking | ✅ E2E parcial (`flows`, `walkin-particular`) |
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
| `interno-modules.spec.ts` | 11 módulos admin |
| `rbac.spec.ts` | RECEPCAO e FATURAMENTO — nav e bloqueios |
| `walkin-particular.spec.ts` | Walk-in, check-in, mapa CRUD e filtro portal |

---

## Referências

- Fluxos de negócio: [`FLUXOS.md`](FLUXOS.md)
- Auditoria de falhas por portal: [`AUDITORIA_FLUXOS.md`](AUDITORIA_FLUXOS.md)
- Arquitetura: [`ARQUITETURA.md`](ARQUITETURA.md)
- Evidências manuais: [`evidencias/`](evidencias/)
- CI: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
