<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

### O que é o Sistema Bibi
POC de plataforma SaaS HealthTech (multi-tenant) com quatro portais segregados por
`role`: **Prestador** (`/login` → `/prestador`), **Interno** (`/interno/login` →
`/interno/dashboard`), **Empresa/PJ** (`/pj/login` → `/pj`) e **Beneficiário**
(`/beneficiario/login` → `/beneficiario`). Núcleo de negócio: faturamento
**Pay Per Use** (cobra apenas procedimentos efetivamente usados, com precificação
dinâmica por empresa).

### Stack e como rodar
- **Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4**, **Prisma 6 + SQLite**.
- Comandos padrão estão em `package.json`: `npm run dev`, `npm run build`, `npm run lint`.
- Banco local (Prisma + SQLite): primeiro setup em uma VM nova exige criar o `.env`
  e popular o banco (o `dev.db` e o `.env` são gitignored, então **não** vêm no checkout):
  - `cp .env.example .env` (se `.env` não existir)
  - `npm run db:reset` (faz `prisma db push --force-reset` + seed) ou `npm run db:push && npm run db:seed`
- O `postinstall` roda `prisma generate` automaticamente no `npm install`.

### Credenciais de demonstração (criadas pelo seed)
- Prestador: `dra.helena@bibi.health` / `bibi123`
- Interno:   `faturamento@bibi.health` / `bibi123`
- Empresa PJ: `rh@techcorp.com` / `bibi123`
- Beneficiário: `joao.pereira@email.com` / `bibi123`

### Notas não óbvias
- **Prisma 7** quebra o schema atual (remove `url` do datasource e exige driver
  adapters + `prisma.config.ts`). O projeto está **fixado em Prisma 6** de propósito;
  não faça upgrade sem migrar o schema.
- **Middleware virou "Proxy" no Next 16**: a proteção de rotas está em `src/proxy.ts`
  (não existe `middleware.ts`). Ele só faz checagem otimista do cookie; a validação
  real (assinatura HMAC + `role`) acontece no servidor (`src/lib/session.ts`).
- `params`/`searchParams`/`cookies()` são **assíncronos** (use `await`).
- ESLint v9 (flat config) trata `react-hooks/set-state-in-effect` como **erro**:
  não chame funções que fazem `setState` de forma síncrona dentro de `useEffect`;
  use uma IIFE assíncrona (padrão já adotado em `BillingView`/`AtendimentoView`).
- SQLite não suporta enums no Prisma; `role`/`status`/`category` são `String`.
- Senhas estão em texto puro **apenas para a POC** (ver `prisma/seed.ts`).
- **Netlify:** config em `netlify.toml`; build com `npm run netlify:build`; **não publicar**
  até revisar `docs/DEPLOY_NETLIFY.md` e env vars no painel. Site linkado na CLI pode
  retornar `503 usage_exceeded` se a cota estiver esgotada.
- **Design system / white label**: tokens em `src/app/globals.css`, primitivos em
  `src/components/ui/`, branding por tenant via `TenantBranding` + `TenantTheme`.
  Ver `docs/DESIGN_SYSTEM.md`. Use `PortalShell` + `PageHeader` em novas páginas de portal.
