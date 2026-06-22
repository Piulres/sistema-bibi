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
**Deploy (PRs #26–#28, #32–#34, #39):** ambiente Cloud Agent, plugin Blobs regional,
Prisma `rhel-openssl-3.0.x`, pipeline CI Git (`publish = ".next"` no `netlify.toml`).
**Produção:** https://sistema-bibi.netlify.app
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
| VitaCare (white-label) | `operacao@vitacare.demo` |

Volume do seed: `SEED_SCALE=small|medium|large` no `.env` (padrão `medium`).

### Variáveis de ambiente relevantes (`.env.example`)
- `PAYMENT_GATEWAY=mock` — adapter PIX POC (`MockPixAdapter`)
- `COMMUNICATION_PROVIDER=console` — e-mail no console (`ConsoleEmailAdapter`)
- `CRON_SECRET` — protege `POST /api/cron/reminders` e `/api/cron/webhooks`
- `TELEMEDICINE_BASE_URL` — base das salas virtuais mock

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
- **Netlify:** config em `netlify.toml` (`publish = ".next"`); build com `npm run netlify:build`; ver
  `docs/DEPLOY_NETLIFY.md`. Site linkado na CLI pode retornar `503 usage_exceeded`
  se a cota estiver esgotada.
- **Design system / white label:** tokens em `src/app/globals.css`, primitivos em
  `src/components/ui/`, branding por tenant via `TenantBranding` + `TenantTheme`.
  Ver `docs/DESIGN_SYSTEM.md`. Use `PortalShell` + `PageHeader` em novas páginas de portal.
- **Documentação completa:** `README.md`, `docs/FLUXOS.md` (fluxos), `docs/BENCHMARK.md` (posicionamento vs mercado),
  `docs/ARQUITETURA.md`, `docs/NOTEBOOKLM.md` (RAG), `docs/PAYMENTS.md`, `docs/COMMUNICATIONS.md`,
  `docs/HISTORICO_2026-06-21.md` (auditoria PRs/deploys), `docs/evidencias/` (capturas dos fluxos).
