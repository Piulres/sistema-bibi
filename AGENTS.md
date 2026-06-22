<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### O que é o Sistema Bibi
POC de plataforma SaaS HealthTech (multi-tenant) com **quatro portais** segregados por
`role`: **Prestador** (`/login` → `/prestador`), **Interno** (`/interno/login` →
`/interno/dashboard`), **Empresa/PJ** (`/pj/login` → `/pj`) e **Beneficiário**
(`/beneficiario/login` → `/beneficiario`). Núcleo de negócio: faturamento
**Pay Per Use** (cobra apenas procedimentos efetivamente usados, com precificação
dinâmica por empresa).

**Tiers mergeados (PRs #17–#23):** ciclo de receita (PIX mock), operação (CRUD,
agenda, relatórios, PEP), B2B (RBAC, webhooks, portal PJ, LGPD), enterprise
(MFA TOTP, telemedicina, TISS XML, webhook retry), docs completas e UI PIX no faturamento interno.
**Deploy (PRs #26–#28):** ambiente Cloud Agent, tentativa Netlify Agent (#27) e
fix produção Blobs regional + Prisma `rhel-openssl-3.0.x` (#28).
**Produção:** https://sistema-bibi.netlify.app — pode retornar **503 `usage_exceeded`**
(cota Netlify). Pacote em produção: **`v1.0.0`** (`685cc21`). Ver `docs/RELEASES.md`.
**Workflow:** desenvolver local → `npm run pre-release` → deploy manual só quando o usuário pedir.
Ver `docs/WORKFLOW_CURSOR.md` e **`docs/OPERACOES.md`** (mapa completo de operações).
**Preferências IA:** `AGENTS.md` (esta seção) + `.cursor/rules/operacoes-bibi.mdc`.
**Evidências:** `docs/evidencias/` (vídeos/screenshots dos fluxos validados).
**Histórico 21/06:** `docs/HISTORICO_2026-06-21.md`

### Stack e como rodar
- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4**, **Prisma 6 + SQLite**.
- Comandos padrão estão em `package.json`: `npm run dev`, `npm run build`, `npm run lint`.
- Banco local (Prisma + SQLite): primeiro setup em uma VM nova exige criar o `.env`
  e popular o banco (o `dev.db` e o `.env` são gitignored, então **não** vêm no checkout):
 - `cp .env.example .env` (se `.env` não existir)
 - `npm run db:reset` (faz `prisma db push --force-reset` + seed) ou `npm run db:push && npm run db:seed`
- O `postinstall` roda `prisma generate` automaticamente no `npm install`.
- **Agentes (Cursor): `npm run db:reset` é BLOQUEADO** — qualquer comando Prisma
 destrutivo (`--force-reset`/`migrate`) dispara um prompt de consentimento e aborta.
 Em VM nova use o caminho não destrutivo `npm run db:push && npm run db:seed`
 (o `.env` e o `dev.db` ficam no snapshot da VM, então isso é só no primeiro setup).

### Credenciais de demonstração (criadas pelo seed)
Senha única: **`bibi123`** (hash **scrypt** via `src/lib/password.ts`).

Massa demo (PR #31): **50 empresas PJ**, **199 beneficiários**, **27 usuários PJ** + fluxo demo TechCorp intacto.

| Portal | E-mail |
|--------|--------|
| Prestador | `dra.helena@bibi.health` |
| Interno (admin) | `faturamento@bibi.health` |
| Interno (faturamento / RBAC) | `financeiro@bibi.health` |
| Interno (recepção / RBAC) | `recepcao@bibi.health` |
| Interno (MFA demo) | `seguranca@bibi.health` — secret TOTP `JBSWY3DPEHPK3PXP` |
| Empresa PJ | `rh@techcorp.com` |
| Beneficiário | `joao.pereira@email.com` |
| Beneficiário (particular) | `pedro.almeida@email.com` |
| VitaCare (white-label) | `operacao@vitacare.demo` |

Volume do seed: `SEED_SCALE=small|medium|large` no `.env` (padrão `medium`).

**Restaurar modo demo:** `/interno/seguranca` → botão “Restaurar estado original do seed” (somente ADMIN; em produção via `ALLOW_DEMO_RESET=true` no `netlify.toml`).
### Operações e preferências de IA

**Manual completo:** `docs/OPERACOES.md` · **Regras Cursor:**
`.cursor/rules/operacoes-bibi.mdc` (core) · `netlify-release.mdc` (deploy) · `stack-nextjs.mdc` (código)

| Operação | Comando | Agente pode? |
|----------|---------|--------------|
| Desenvolver | `npm run dev` | ✅ Sim |
| Emular Netlify | `npm run netlify:dev` | ✅ Sim |
| Lint | `npm run lint` | ✅ Sim |
| Validar pacote | `npm run pre-release` | ✅ Sim (não publica) |
| Setup banco VM nova | `db:push && db:seed` | ✅ Sim |
| Reset banco | `npm run db:reset` | ❌ Bloqueado |
| Deploy produção | `netlify deploy --prod` | ❌ Só se usuário pedir |
| Atualizar release | `docs/RELEASES.md` | ❌ Só após deploy confirmado |

**Modelo:** pacotes fechados — `main` acumula código; produção muda só com deploy manual humano.

**503 `usage_exceeded`:** cota Netlify, não bug. Não investigar em loop nem redeployar automaticamente.

**Árvore rápida:**
- Feature/bug → dev local + lint
- Validar release → `pre-release`
- Produção fora → `curl` uma vez; se `usage_exceeded`, avisar usuário
- Publicar → só com pedido explícito; seguir `OPERACOES.md` §5

### Variáveis de ambiente relevantes (`.env.example`)

Mapa completo: [`docs/VARIAVEIS_AMBIENTE.md`](docs/VARIAVEIS_AMBIENTE.md) (inclui Netlify, CI, testes e **Cursor Cloud Agent**).

- `DATABASE_URL` — SQLite (`file:./dev.db`)
- `SESSION_SECRET` — cookie de sessão + MFA
- `PAYMENT_GATEWAY=mock` — adapter PIX POC
- `COMMUNICATION_PROVIDER=console` — e-mail no console
- `CRON_SECRET` — jobs `/api/cron/*`
- `TELEMEDICINE_BASE_URL` — salas de telemedicina mock
- `SEED_SCALE` — volume da massa (`small` | `medium` | `large`)
- `ALLOW_DEMO_RESET` — restaurar demo na UI (padrão `true`)

### Navegação SPA (layouts persistentes)

| Portal | Layout | Nav | Breadcrumbs |
|--------|--------|-----|-------------|
| Interno | `src/app/interno/layout.tsx` | `InternoNav` — 11 abas + drawer mobile | Cliente 360° (`buildPatientBreadcrumbs`) |
| Prestador | `src/app/prestador/layout.tsx` | `PrestadorNav` | Atendimento (`buildAtendimentoBreadcrumbs`) |
| PJ | `src/app/pj/layout.tsx` | `SectionNav` — 4 seções | — |
| Beneficiário | `src/app/beneficiario/layout.tsx` | `SectionNav` — 8 seções | — |
| Landing | — | `LandingHeader` + `LandingMobileMenu` | — |

**Config:** `src/lib/navigation/routes.ts` · **Padrão:** pages só com `PageHeader` + view (não repetir `PortalShell`/`InternoNav`).

### Operação clínica e mapa CRUD

| Recurso | Onde | Fonte |
|---------|------|-------|
| Walk-in particular | `/interno/agenda` → seção walk-in | `AppointmentsView.tsx` |
| Edição cadastros | `/interno/cadastros` → Editar em cada aba | `CadastrosView.tsx` |
| Mapa CRUD (27 entidades) | `/interno/cadastros?tab=operations` | `src/lib/crud-operations-map.ts` |

Detalhe de fluxos: `docs/FLUXOS.md` §4.2, §8.5–8.6 · Demo particular: `pedro.almeida@email.com`.

### Notas não óbvias
- **Prisma 7** quebra o schema atual (remove `url` do datasource e exige driver
  adapters + `prisma.config.ts`). O projeto está **fixado em Prisma 6** de propósito;
  não faça upgrade sem migrar o schema.
- **Middleware virou "Proxy" no Next 16**: a proteção de rotas está em `src/proxy.ts`
  (não existe `middleware.ts`). Ele só faz checagem otimista do cookie; a validação
  real (assinatura HMAC + `role`) acontece no servidor (`src/lib/session.ts`).
- **RBAC interno:** `User.internoProfile` (`ADMIN`, `FATURAMENTO`, `RECEPCAO`, `READONLY`)
  filtra nav e APIs via `interno-permissions.ts` / `interno-guard.ts`.
- `params`/`searchParams`/`cookies()` são **assíncronos** (use `await`).
- ESLint v9 (flat config) trata `react-hooks/set-state-in-effect` como **erro**:
  não chame funções que fazem `setState` de forma síncrona dentro de `useEffect`;
  use uma IIFE assíncrona (padrão já adotado em `BillingView`/`AtendimentoView`).
- SQLite não suporta enums no Prisma; `role`/`status`/`category` são `String`.
- **Netlify:** config em `netlify.toml`; validar pacote com `npm run pre-release` (não publica);
  build CI em `npm run netlify:build`; ver `docs/DEPLOY_NETLIFY.md` e `docs/WORKFLOW_CURSOR.md`.
  Site pode retornar `503 usage_exceeded` se a cota estiver esgotada — **não** tratar como bug de código.
- **Política de deploy (agentes):** **NUNCA** executar `netlify deploy --prod` nem investigar produção
  em loop, salvo pedido explícito do usuário. Testar com `npm run dev` / `npm run pre-release`.
  Pacotes fechados: `docs/RELEASES.md`.
- **Design system / white label:** tokens em `src/app/globals.css`, primitivos em
  `src/components/ui/`, branding por tenant via `TenantBranding` + `TenantTheme`.
  Ver `docs/DESIGN_SYSTEM.md`. **Navegação SPA (PR #58):** layouts por portal em
  `src/app/{interno,prestador,pj,beneficiario}/layout.tsx` — shell persistente;
  páginas só renderizam `PageHeader` + conteúdo. Config central: `src/lib/navigation/`.
  Componentes: `Breadcrumbs`, `SectionNav`, `MobileNavDrawer`, `NavigationProgress`.
- **Documentação completa:** `README.md`, `docs/FLUXOS.md` (fluxos), `docs/JORNADA_CLIENTE.md` (jornada UX nos 4 portais), `docs/AUDITORIA_FLUXOS.md` (falhas mapeadas por portal),
  `docs/BENCHMARK.md` (posicionamento vs mercado),
  `docs/ARQUITETURA.md`, `docs/TESTES.md` (estratégia e mapa de testes automatizados),
  `docs/NOTEBOOKLM.md` (RAG), `docs/PAYMENTS.md`, `docs/COMMUNICATIONS.md`,
  `docs/VARIAVEIS_AMBIENTE.md` (mapa de env vars, CI, Netlify e Cursor),
  `docs/HISTORICO_2026-06-21.md` (auditoria PRs/deploys), `docs/evidencias/` (capturas dos fluxos).
  `docs/ARQUITETURA.md`, `docs/NOTEBOOKLM.md` (RAG), `docs/PAYMENTS.md`, `docs/COMMUNICATIONS.md`,
  `docs/HISTORICO_2026-06-21.md` (auditoria PRs/deploys), `docs/OPERACOES.md` (mapa de operações),
  `docs/RELEASES.md` (pacotes fechados), `docs/WORKFLOW_CURSOR.md` (dev sem deploy),
  `.cursor/rules/operacoes-bibi.mdc` (core), `netlify-release.mdc` (deploy), `stack-nextjs.mdc` (código), `docs/evidencias/` (capturas dos fluxos).
